var Belt = {
	tag: function (token, obj, attr) {
		attr = attr || '_id'
		return token + '' + obj[attr];
	},
	collectionList: {'users': Meteor.users},
	addCollection: function (name, collection) {
		this.collectionList[name] = collection;
	},
	collection: function (name) {
		return this.collectionList[name];
	}
};

Belt.anon = {
	equals: function (one, two) { return one == two; },
	add: function (one, two) { return one + two; },
	sub: function (one, two) { return one - two; },
	idIn: function (context, attr) { return {_id: {$in: context[attr]}}; },
	attrIsId: function (context, attr) {
		var give = {};
		give[attr] = context._id;
		return give;
	}
};

Belt.gauntlet = {
	run: function (tests, input) {
		var give = {value: input};

		give.passed = tests.every(function (tester) {
			try {
				give.value = tester(give.value);
				return true;
			}
			catch (error) {
				give.message = error;
				return false;
			}
		});

		return give;
	},
	_existence: function (input) {
		input = input.trim();
		if (input == '' || input == undefined || input == null) throw "Doesn't Exist";
		return input;
	},
	_hasNumber: function (input) {
		input = parseFloat(input)
		if (isNaN(input)) throw "Isn't a Number";
		return input;	
	},
	_pureNumber: function (input) {
		input = input.trim();
		var originalLength = input.length;
		input = parseFloat(input);
		if (originalLength != input.length) throw "Isn't Purely a Number";
		return input;
	},
	_price: function (input) {
		input = input.replace(/\$/,'');
		if (input < 0) throw "Isn't a Positive Number";
		return input;
	},
	_realPrice: function (input) {
		input = input.replace(/\$/,'');
		if (input = 0) throw "Price is Zero";
		if (input < 0) throw "Price is Negative";
		return input;
	},
	_positive: function (input) {
		if (input < 0) throw "Isn't a Positive Number";
		return input;
	},
	_realPositive: function (input) {
		if (input = 0) throw "Number is Zero";
		if (input < 0) throw "Number is Negative";
	},
	_date: function (input) {
		var m = moment(input, ['M-D-YYYY', 'MM-DD-YYYY']);
		if (!m.isValid()) throw "Invalid Date";
		return m.format('MM/DD/YYYY');
	},
	_email: function (input) {
		if (!/\S+@\S+\.\S+/.test(input)) throw "Invalid Email";
		return input;
	},
	_phone: function (input) {
		if (!/\d{3}[\/\s.-]?\d{3}[\/\s.-]?\d{4}/.test(input)) throw "Invalid Phone Number";
		return input;
	}
};

Belt.format = {
	existence: function (input) {
		var g = Belt.gauntlet;
		return g.run([g._existence], input);
	},
	hasNumber: function (input) {
		var g = Belt.gauntlet;
		return g.run([g._existence, g._hasNumber], input);
	},
	pureNumber: function (input) {
		var g = Belt.gauntlet;
		return g.run([g._existence, g._hasNumber, g._pureNumber], input);
	},
	price: function (input) {
		var g = Belt.gauntlet;
		return g.run([g._existence, g._hasNumber, g._price], input);
	},
	realPrice: function (input) {
		var g = Belt.gauntlet;
		return g.run([g._existence, g._hasNumber, g._realPrice], input);
	},
	positive: function (input) {
		var g = Belt.gauntlet;
		return g.run([g._existence, g._pureNumber, g._positive], input);
	},
	realPositive: function (input) {
		var g = Belt.gauntlet;
		return g.run([g._existence, g._pureNumber, g._realPositive], input);
	},
	date: function (input) {
		var g = Belt.gauntlet;
		return g.run([g._existence, g._date], input);
	},
	email: function (input) {
		var g = Belt.gauntlet;
		return g.run([g._existence, g._email], input);
	},
	phone: function (input) {
		var g = Belt.gauntlet;
		return g.run([g._existence, g._phone], input);
	},
	findOneInVouchers: function (input, collection) {
		var g = Belt.gauntlet;
		return g.run([g._existence, g._findOneInVouchers], input);
	}
};

var _setSession = function (variables, value) {
	for (i in variables) {
		Session.set(variables[i], value);
	}
};

var _tagSetSession = function (token, obj, attr, value) {
	attr = attr || '_id';
	if (obj instanceof Array) {
		for (i in obj) {
			Session.set(token + '' + obj[i][attr], value);
		}
	} 
	else {
		Session.set(token + '' + obj[attr], value);
	}
};

Belt.session = {
	erase: function (variables) {
		_setSession(variables, undefined);
	},
	tagErase: function (token, obj, attr) {
		_tagSetSession(token, obj, attr, undefined);
	},
	on: function (variables) {
		_setSession(variables, true);
	},
	tagOn: function (token, obj, attr) {
		_tagSetSession(token, obj, attr, true);
	},
	off: function (variables) {
		_setSession(variables, false);
	},
	tagOff: function (token, obj, attr) {
		_tagSetSession(token, obj, attr, false);
	},
	plug: function (variables, value) {
		_setSession(variables, value);
	},
	tagPlug: function (token, obj, attr, value) {
		_tagSetSession(token, obj, attr, value);
	},
	pluck: function (variables) {
		var obj = {};
		variables.forEach(function (item) {
			obj[item] = Session.get(item);
		});
		return obj;
	},
	reap: function (variables) {
		var arr = [];
		variables.forEach(function (item) {
			arr.push(Session.get(item));
		});
		return arr;
	},
	// tagReap: function (token, object, attr) {
	// 	_tagSetSession(token, object, attr, true);
	// },
	sow: function (obj) {
		for (key in obj) {
			Session.set(key, obj[key]);
		}
	},
	act: function (variables, action) {
		variables.forEach(function (item) {
			// action should have two parameters, key and value.
			action(item, Session.get(item));
		});
	},
	every: function (variables, predicate) {
		var result;
		if (predicate === undefined) {
			result = _.every(variables, function (item) {
				return Session.equals(item, true);
			});
		}
		else if (typeof predicate !== 'function') {
			// Add support for array or object predicates.
			result = _.every(variables, function (item) {
				return Session.equals(item, predicate);
			});
		}
		else {
			var values = [];
			variables.forEach(function (item) {
				values.push(Session.get(item));
			});
			result = _.every(values, predicate);
		}
		return result;
	}
	// any: function (variables, predicate) {
	// 	var result;

	// }
};

Belt.template = {
	every: function (attributes, template, predicate) {
		if (predicate === undefined) {
			predicate = Belt.valid.existence;
		}
		
		if (typeof predicate !== 'function') {
			return attributes.every(function (attribute) {
				return template.find(attribute).value == predicate;
			});
		}
		else {
			return attributes.every(function (attribute) {
				return predicate(template.find(attribute).value);
			});
		}
	},
	same: function (attributes, template, predicate) {
		if (predicate === undefined) {
			predicate = function (here, next) { return here == next; };
		}

		var now, next;
		var index = 0;
		now = template.find(attributes[index]).value;
		next = template.find(attributes[++index]).value;

		while (next != undefined) {
			if (predicate(here, next)) {
				now = next;
				next = template.find(attributes[++index]).value;
			}
			else return false;
		}

		return true;
	},
	equals: function (attributeOne, attributeTwo, template, predicate) {
		if (predicate === undefined) {
			predicate = function (one, two) { return one == two; };
		}

		return predicate(template.find(attributeOne).value, template.find(attributeTwo).value);
	}
};

var _testAttributes = function (attributes, template, dataObj) {
	// attributes				
	// 	inputId, dataAttr, formatter, sessionVar, passValue
	var obj = {};
	var args = [];
	dataObj = dataObj || {};
	var input, attribute, formatter, sessionVar, passValue, data, results;

	var inputsValid = attributes.every(function (item) {
		input = template.find(item[0]).value.trim();
		args.push(input);
		attribute = item[1];
		formatter = item[2];
		sessionVar = item[3];
		passValue = item[4] || undefined;

		if (formatter) results = formatter(input);
		else results = {passed: true, value: input};

		if (results.passed) {
			input = results.value;
			Session.set(sessionVar, passValue);
			data = dataObj[attribute];
			if (input != data) obj[attribute] = input;
			return true;
		}
		else {
			Session.set(sessionVar, results.message);
			return false;
		}
	});

	return {obj: obj, inputsValid: inputsValid, args: args};
};

Belt.base = {
	update: function (collectionName, template, attributes, optMerge, optionalDataObj, optionalTargetId, optionalQueryMaker) {
		var collection = Belt.collection(collectionName);
		var dataObj = optionalDataObj || template.data;
		var id = optionalTargetId || dataObj._id;
		var queryMaker = optionalQueryMaker || function (updateQuery) { return {'$set': updateQuery}; };

		var tests = _testAttributes(attributes, template, dataObj);
		var inputsValid = tests.inputsValid;
		var obj = tests.obj;

		if (inputsValid) {
			optMerge = optMerge || {};
			obj = queryMaker(_.extend(obj, optMerge));
			if (!_.isEmpty(obj)) return collection.update(id, obj);
		}

		return undefined;
	},
	insert: function (collectionName, template, attributes, optMerge) {
		var collection = Belt.collection(collectionName);

		var tests = _testAttributes(attributes, template);
		var inputsValid = tests.inputsValid;
		var obj = tests.obj;

		if (inputsValid) {
			optMerge = optMerge || {};
			obj = _.extend(obj, optMerge);
			if (!_.isEmpty(obj)) return collection.insert(_.extend(obj, optMerge));
		}

		return undefined;
	},
	method: function (method, template, attributes, serverSessionVar, callback, optionalArgs) {
		var tests = _testAttributes(attributes, template);
		var inputsValid = tests.inputsValid;
		var obj = tests.obj;
		optionalArgs = optionalArgs || [];
		var args = optionalArgs.concat(tests.args);

		if (inputsValid) {
			Meteor.apply(method, args, function (error, result) {
				if (error) {
					Session.set(serverSessionVar, error.reason);
				}
				else {
					Session.set(serverSessionVar, undefined);
				}

				if (callback) callback(error, result);
			});
		}

		return inputsValid;
	},
	reap: function (collectionName, ids, options) {
		var collection = Belt.collection(collectionName);
		if (ids instanceof Array) {
			var give = collection.find({_id: {$in: ids}}, options);
			if (give.count() != 0) return give;
			else return false;
		}
		else if (ids) {
			var give = collection.find(ids, options);
			if (give.count() != 0) return give;
			else return false;
		}
		else return false;
	},
	// sow
	reduce: function (list, predicate, reduction) {
		// list [
		// 	[collectionName, identifier, identContext, identAttr, reduceAttr, optPos, optNeg]
		// ]

		var collectionName, identifier, identContext, identAttr, reduceAttr, reduceHere, childList;

		list.forEach(function (item) {
			collectionName = item[0];
			identifier = item[1];
			identContext = item[2];
			identAttr = item[3];
			reduceAttr = item[4];
			reduceHere = !!reduceAttr;
			childList = item[5];

			identifier = identifier(context, attr);

			Belt.base.collection(collectionName).find(identifier).forEach(function (doc) {
				if (reduceHere) reduction = predicate(reduction, doc[reduceAttr]);

				if (childList) {
					childList[2] = doc;
					reduction = this.reduce(childList, predicate, reduction);
				}
			});

		});

		return reduction;
	}
};

Belt.user = {};
Belt.callback = {};

Belt.helpers = {
	addRendered: function (templates, func) {
		// this.addHelper(templates, 'rendered', func);
		for (i in templates) {
			Template[templates[i]].rendered = func;
		}
	},
	addCreated: function (templates, func) {
		// this.addHelper(templates, 'created', func);
		for (i in templates) {
			Template[templates[i]].created = func;
		}
	},
	addHelper: function (templates, helperName, func) {
		for (i in templates) {
			Template[templates[i]][helperName] = func;
		}
	},
	state: function (name, variables) {
		var handle, initial, comparator, toggleFunc, onEvent, offEvent, onFunc, offFunc;

		Template[name].created = function () {
			for (variable in variables) {
				handle = variable.handle;
				initial = variable.initial || false;
				comparator = variable.comparator || function (oldvar, newvar) {
					return oldvar == newvar;
				};

				this[handle] = new ReactiveVar(initial, comparator);
			}
		}

		var helpers = {};
		for (variable in variables) {
			handle = variable.handle;
			helpers.handle = function () {
				return Template.instance()[handle].get();
			}
		}
		Template[name].helpers(helpers);

		var events = {};
		for (variable in variables) {
			handle = variable.handle;

			// functions
			toggleFunc = variable.toggleFunc;
			if (toggleFunc) {
				onFunc = toggleFunc;
				offFunc = toggleFunc;
			}
			else {
				onFunc = variable.onFunc;
				offFunc = variable.offFunc;
			}

			// assigning events
			if (variable.toggleEvent) {
				events[variable.toggleEvent] = function (e, t) {
					var newval = !t[handle].get();
					t[handle].set(newval);

					if (newval && onFunc) onFunc(e, t);
					else if (!newval && offFunc) offFunc(e, t);
				};
			}
			else {
				onEvent = variable.onEvent;
				offEvent = variable.offEvent;

				events[onEvent] = function (e, t) {
					t[handle].set(true);
					if (onFunc) onFunc(e, t);
				};
				events[offEvent] = function (e, t) {
					t[handle].set(false);
					if (offFunc) offFunc(e, t);
				};
			}
		}
		Template[name].events(events);
	},
	editing: function (variables) {
		this.state('editing', variables);
	}
};

export { Belt };