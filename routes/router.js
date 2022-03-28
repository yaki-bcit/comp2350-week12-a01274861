const router = require('express').Router();
const Joi = require("joi");

const database = include('databaseConnection');
//const dbModel = include('databaseAccessLayer');
//const dbModel = include('staticData');

// const userModel = include('models/web_user');
// const petModel = include('models/pet');

const crypto = require('crypto');
const {v4: uuid} = require('uuid');
const { ObjectId } = require('mongodb');

const passwordPepper = "SeCretPeppa4MySal+";

router.get('/', async (req, res) => {
	console.log("page hit");
	try {
		//const users = await userModel.findAll({attributes: ['web_user_id','first_name','last_name','email']}); //{where: {web_user_id: 1}}
		
		const userCollection = database.db('lab_example').collection('users');
		const users = await userCollection.find().project({first_name: 1, last_name: 1, email: 1, _id: 1}).toArray();
		
		if (users === null) {
			res.render('error', {message: 'Error connecting to MongoDB'});
			console.log("Error connecting to userModel");
		}
		else {
			console.log(users);
			res.render('index', {allUsers: users});
		}
	}
	catch(ex) {
		res.render('error', {message: 'Error connecting to MongoDB'});
		console.log("Error connecting to MongoDB");
		console.log(ex);
	}
});

router.get('/pets', async (req, res) => {
	console.log("page hit");
	try {
		//const pets = await petModel.findAll({attributes: ['name']}); //{where: {web_user_id: 1}}

		const petCollection = database.db('lab_example').collection('pets');
		//const pets = await petCollection.find().project({name: 1}).toArray();

		if (pets === null) {
			res.render('error', {message: 'Error connecting to MySQL'});
			console.log("Error connecting to userModel");
		}
		else {
			console.log(pets);
			res.render('pets', {allPets: pets});
		}
	}
	catch(ex) {
		res.render('error', {message: 'Error connecting to MySQL'});
		console.log("Error connecting to MySQL");
		console.log(ex);
	}
});



router.get('/showPets', async (req, res) => {
	console.log("page hit");
	try {
		let userId = req.query.id;

		const schema = Joi.string().alphanum().min(24).max(24).required();
		const validationResult = schema.validate(userId);
		if (validationResult.error != null) {
			console.log(validationResult.error);
			throw validationResult.error;
		}

		//const user = await userModel.findByPk(userId); 

		const userCollection = database.db('lab_example').collection('users');
		const user = await userCollection.find( { _id: userId } );

		if (user === null) {
			res.render('error', {message: 'Error connecting to MongoDB'});
			console.log("Error connecting to MongoDB");
		}
		else {
			/* let pets = await user.getPets();
			console.log(pets);
			let owner = await pets[0].getOwner();
			console.log(owner); */

			const petCollection = database.db('lab_example').collection('pets');
			const pets = await petCollection.find( { owner_id: userId } ).toArray();
			
			res.render('pets', {allPets: pets});
		}
	}
	catch(ex) {
		res.render('error', {message: 'Error connecting to MongoDB'});
		console.log("Error connecting to MongoDB");
		console.log(ex);
	}
});

router.get('/deleteUser', async (req, res) => {
	try {
		console.log("delete user");

		let userId = req.query.id;
		if (userId) {

			const schema = Joi.string().alphanum().min(24).max(24).required();
			const validationResult = schema.validate(userId);
			if (validationResult.error != null) {
				console.log(validationResult.error);
				throw validationResult.error;
			}

			console.log("userId: "+userId);
			//let deleteUser = await userModel.findByPk(userId);
			//console.log("deleteUser: ");
			//console.log(deleteUser);
			/* if (deleteUser !== null) {
				await deleteUser.destroy();
			} */

			const userCollection = database.db('lab_example').collection('users');
			userCollection.deleteOne( { "_id" : ObjectId(userId)} );
		}
		res.redirect("/");
	}
	catch(ex) {
		res.render('error', {message: 'Error connecting to MongoDB'});
		console.log("Error connecting to MongoDB");
		console.log(ex);	
	}
});

router.post('/addUser', async (req, res) => {
	try {
		console.log("form submit");

		const schema = Joi.object({
			first_name: Joi.string().alphanum().min(1).max(30).required(),
			last_name: Joi.string().alphanum().min(1).max(30).required(),
			email: Joi.string().email(),
			password: Joi.string().min(1).max(30).required()
		});

		const validationResult = schema.validate({
			first_name: req.body.first_name,
			last_name: req.body.last_name,
			email: req.body.email,
			password: req.body.password
		});
		
		if (validationResult.error != null) {
			console.log(validationResult.error);
			throw validationResult.error;
		}

		const password_salt = crypto.createHash('sha512');

		password_salt.update(uuid());
		
		const password_hash = crypto.createHash('sha512');

		password_hash.update(req.body.password+passwordPepper+password_salt);


		/* let newUser = userModel.build(
			{	
				first_name: req.body.first_name,
				last_name: req.body.last_name,
				email: req.body.email,
				password_salt: password_salt.digest('hex'),
				password_hash: password_hash.digest('hex')
			}
		); */
		//await newUser.save();

		const userCollection = database.db('lab_example').collection('users');
		userCollection.insertOne(
			{
				first_name: req.body.first_name,
				last_name: req.body.last_name,
				email: req.body.email,
				password_salt: password_salt.digest('hex'),
				password_hash: password_hash.digest('hex')
			}
		);

		res.redirect("/");
	}
	catch(ex) {
		res.render('error', {message: 'Error connecting to MongoDB'});
		console.log("Error connecting to MongoDB");
		console.log(ex);	
	}
});

/*
router.get('/', (req, res) => {
	console.log("page hit");
	database.getConnection(function (err, dbConnection) {
		if (err) {
			res.render('error', {message: 'Error connecting to MySQL'});
			console.log("Error connecting to mysql");
			console.log(err);
		}
		else {
			
			dbModel.getAllUsers((err, result) => {
				if (err) {
					res.render('error', {message: 'Error reading from MySQL'});
					console.log("Error reading from mysql");
					console.log(err);
				}
				else { //success
					res.render('index', {allUsers: result});

					//Output the results of the query to the Heroku Logs
					console.log(result);
				}
			});
			dbConnection.release();
		}
	});
});
*/

/*
router.post('/addUser', (req, res) => {
	console.log("form submit");
	database.getConnection(function (err, dbConnection) {
		if (err) {
			res.render('error', {message: 'Error connecting to MySQL'});
			console.log("Error connecting to mysql");
			console.log(err);
		}
		else {
			console.log(req.body);
			dbModel.addUser(req.body, (err, result) => {
				if (err) {
					res.render('error', {message: 'Error writing to MySQL'});
					console.log("Error writing to mysql");
					console.log(err);
				}
				else { //success
					res.redirect("/");

					//Output the results of the query to the Heroku Logs
					console.log(result);
				}
			});
			
			dbConnection.release();
		}
	});

});
*/

/*
router.get('/deleteUser', (req, res) => {
	console.log("delete user");
	database.getConnection(function (err, dbConnection) {
		if (err) {
			res.render('error', {message: 'Error connecting to MySQL'});
			console.log("Error connecting to mysql");
			console.log(err);
		}
		else {
			console.log(req.query);

			let userId = req.query.id;
			if (userId) {
				dbModel.deleteUser(userId, (err, result) => {
					if (err) {
						res.render('error', {message: 'Error writing to MySQL'});
						console.log("Error writing to mysql");
						console.log(err);
					}
					else { //success
						res.redirect("/");

						//Output the results of the query to the Heroku Logs
						console.log(result);
					}
				});
			}
			else {
				res.render('error', {message: 'Error on Delete'});
			}
		
			dbConnection.release();
		}
	});
});
*/

module.exports = router;
