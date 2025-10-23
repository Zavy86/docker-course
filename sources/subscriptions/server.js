import express from 'express';
import { Sequelize, DataTypes } from 'sequelize';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://dbuser:dbpass@db:5432/subscriptions';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

const Subscription = sequelize.define('Subscription', {
  firstname: { type: DataTypes.STRING, allowNull: false },
  lastname: { type: DataTypes.STRING, allowNull: false },
  mail: { type: DataTypes.STRING, allowNull: false },
}, {
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: false,
  tableName: 'subscriptions',
});

async function start() {
  await sequelize.authenticate();
  await sequelize.sync();

  const app = express();

  app.use(express.urlencoded({ extended: true }));

  app.get('/', async (req, res) => {
    const subscribers = await Subscription.findAll({ order: [['createdAt', 'DESC']] });
    res.send(`
      <h1>Subscribe</h1>
      <form method="POST" action="/subscribe">
        <label>Firstname: <input name="firstname" required/></label><br/><br/>
        <label>Lastname: <input name="lastname" required/></label><br/><br/>
        <label>Mail: <input name="mail" type="email" size="32" required/></label><br/><br/>
        <button type="submit">Subscribe</button>
      </form>
      <hr/>
      <h1>Subscribers</h1>
      <ul>
        ${subscribers.map(sub => `<li>${sub.firstname} ${sub.lastname} (${sub.mail})</li>`).join('')}
      </ul>
    `);
  });

  app.post('/subscribe', async (req, res) => {
    const { firstname, lastname, mail } = req.body;
    if(! firstname || ! lastname || ! mail) return res.status(400).send('All fields are required.');
    await Subscription.create({firstname, lastname, mail });
    res.send('Subscription confirmed!<br/><br/><a href="/">Continue</a>');
  });

  app.listen(3000, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:3000`);
  });

}

start();
