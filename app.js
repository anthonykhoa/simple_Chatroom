const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const JWT = require('jsonwebtoken');
const users = [];
const chatRooms = {
	town: []
};
/*
	Structure for chatRooms

	{
		roomName: [{name, message}]
	}
*/
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/', express.static(__dirname));

const authenticateUSER = (req, res, next) => {
	const authHeader = req.headers.authorization;
	const token = authHeader && authHeader.split(' ')[1];
	if (token === null) return res.status(401).send();
	JWT.verify(token, 'supersecretKey', (err, user) => {
		req.user = err ? undefined : user;
		next();
	});
}

const nameTaken = (username, email) => {
	return users.some(e => (e.username === username || e.email === email))
}

const createToken = (user) => JWT.sign(user, 'supersecretKey');

//sends back user info, uses to determine to render login or room page
app.get('/api/session', authenticateUSER, (req, res) => {
	req.user === undefined ? res.json('NO') : res.json(req.user);
});

//use bcrypt.compare to compare hashed salt passwords
app.post('/auth/api/login', async (req, res) => {
	console.log('hi')
	const user = users.find(user => user.username === req.body.username);
	if (user === null) return res.status(400).send('cann0t find user');
	try {
		if (await bcrypt.compare(req.body.password, user.password)) {
			const accessToken = createToken(user);
			res.json({
				username: req.body.username,
				jwt: accessToken
			})
		} else {
			res.send('not allowed');
		}
	} catch {
		res.status(500).send();
	}
});

//creates new account
app.post('/auth/api/signUp', async (req, res) => {
	try {
		const hashedPassword = await bcrypt.hash(req.body.password, 3);
		const user = {
			name: req.body.name,
			username: req.body.username,
			email: req.body.email,
			password: hashedPassword
		};
		if (nameTaken(user.username, user.email)) return ;
		users.push(user);
		res.status(201);
		const accessToken = createToken(user);
		res.json({
			username: req.body.username,
			jwt: accessToken
		})
	} catch {
		res.status(500).send();
	}
})

//returns message log of chatroom
app.post('/api/chatrooms', (req, res) => {
	const room = req.body.room
	if (!room || room in chatRooms) return res.status(400).send();
	chatRooms[room] = [];
	res.status(200).send()
});

//returns arr of chatroom names
app.get('/api/chatrooms', authenticateUSER, (req, res) => res.json(Object.keys(chatRooms)))

app.get('/api/:room/messages', authenticateUSER, (req, res) => res.json(chatRooms[req.params.room]));

//creates new messages in a room
app.post('/api/:room/messages', authenticateUSER, (req, res) => {
	const room = req.params.room;
	chatRooms[room].push({username: req.body.username, message: req.body.message})
	console.log(chatRooms)
	res.status(200).send();
});

app.get('/', (req, res) => res.sendFile('index.html'));

app.listen(3333)


