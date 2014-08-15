module.exports = function Route(app) {

	var polls = [
		{
			author: 'Lisa',
			question: 'Who is the best dog?',
			option1: 'a',
			option2: 'b',
			option3: 'c',
			option4: 'd',
			results: {
				opt1: 0,
				opt2: 0,
				opt3: 0,
				opt4: 0
			}
		}
	];
	var pollIndexes = [0];
	var error;
	var pollId;

	app.get('/', function(req, res) {
		res.render('index', { title: 'Login', errors: error });
		error = '';
	})

	app.get('/polls', function(req, res) {
		if(!req.session.name) {
			error = 'Please log in.';
			res.redirect('/');
		} else {
			res.render('polls', { title: 'List Polls', user: req.session })
		}
	})

	app.get('/polls/:id', function(req, res) {
		if(pollIndexes.indexOf(parseInt(req.params.id)) != -1) {
			var thisPoll = polls[req.params.id];
			pollId = req.params.id;
			res.render('poll_show', { title: 'Survey Poll', poll: thisPoll, pollId: req.params.id, user:req.session })
		} else {
			res.redirect('/')
		}
	})

	app.get('/logout', function(req, res) {
		req.session = null;
		res.redirect('/')
	})

	app.get('/poll/create', function(req, res) {
		if(!req.session.name) {
			error = 'Please log in.';
			res.redirect('/');
		} else {
			res.render('poll_create', { title: 'Create Poll', user: req.session })
		}
	})

	app.io.route('new_user', function(req) {
		req.session.name = req.data;
		req.session.save(function(){})
	})

	app.io.route('show_me_polls', function(req, res) {
		req.io.emit('existing_polls', { allPolls: polls, indexes: pollIndexes })
	})

	app.io.route('place_vote', function(req, res) {
		var value;
		if(req.data.option == 'opt1') {
			polls[req.data.pollId].results.opt1++
			value = polls[req.data.pollId].results.opt1;
		}
		if(req.data.option == 'opt2') {
			polls[req.data.pollId].results.opt2++
			value = polls[req.data.pollId].results.opt2;
		}
		if(req.data.option == 'opt3') {
			polls[req.data.pollId].results.opt3++
			value = polls[req.data.pollId].results.opt3;
		}
		if(req.data.option == 'opt4') {
			polls[req.data.pollId].results.opt4++
			value = polls[req.data.pollId].results.opt4;
		}
		app.io.broadcast('update_votes', { pollId: req.data.pollId, option: req.data.option, points: value })
	})

	app.post('/process', function(req, res) {
		var newPollId = Math.floor(Math.random()*10000);
		console.log(newPollId)
		while(pollIndexes.indexOf(newPollId) != -1) {
			newPollId = Math.floor(Math.random()*10000);
		}
		polls[newPollId] = {
			author: req.session.name,
			question: req.body.question,
			option1: req.body.opt1,
			option2: req.body.opt2,
			option3: req.body.opt3,
			option4: req.body.opt4,
			results: {
				opt1: 0,
				opt2: 0,
				opt3: 0,
				opt4: 0
			}
		}
		pollIndexes.push(newPollId);
		var url = '/polls/'+newPollId;
		res.redirect(url);
		app.io.broadcast('update_polls', { newPollInfo: polls[newPollId], pollId: newPollId })
	})

}