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
      <style>
        body { font-family: sans-serif; background: #f9f9f9; margin: 2em; }
        form { background: #fff; padding: 1em 2em; border-radius: 8px; box-shadow: 0 2px 8px #0001; max-width: 400px; }
        label { display: block; margin-bottom: 1em; }
        input { padding: 0.4em; border: 1px solid #ccc; border-radius: 4px; }
        form label { display: flex; align-items: center; margin-bottom: 1em; gap: 1em; }
        form input { flex: 1; width: 100%; box-sizing: border-box; }
        button { padding: 0.5em 1.2em; border: none; background: #007bff; color: #fff; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
        ul { background: #fff; padding: 1em 2em; border-radius: 8px; box-shadow: 0 2px 8px #0001; max-width: 400px; }
        li { margin-bottom: 0.5em; }
        hr { margin: 2em 0; }
      </style>
      <h1>Subscribe</h1>
      <form method="POST" action="/subscribe">
        <label>Firstname: <input name="firstname" required/></label>
        <label>Lastname: <input name="lastname" required/></label>
        <label>Mail: <input name="mail" type="email" required/></label>
        <button type="submit">Subscribe</button>
      </form>
      <hr/>
      <h1>Subscribers</h1>
      <ul>
        ${subscribers.length === 0 ? `<li>No subscribers yet...</li>` : subscribers
          .map(sub => `<li>${sub.firstname} ${sub.lastname} (${sub.mail})</li>`).join('')}
      </ul>
    `);
  });

  app.post('/subscribe', async (req, res) => {
    const { firstname, lastname, mail } = req.body;
    if(! firstname || ! lastname || ! mail) return res.status(400).send('All fields are required.');
    await Subscription.create({firstname, lastname, mail });
    res.redirect('/');
  });

  app.listen(3000, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:3000`);
  });

}

start();
