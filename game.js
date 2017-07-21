var xMoveAxis = 0;
var playerSpeed = 0.3;

var gameScreen = document.getElementById('gameScreen');
gameScreen.width = document.body.offsetWidth;
gameScreen.height = document.body.offsetHeight;

var tools = gameScreen.getContext('2d');

var gameObjects = [];
function GameObject(x, y, width, height) {
	var me = this;

	me.position = new Vector2D(x, y);
	me.velocity = new Vector2D(0,0);
	me.friction = 0.5;
	me.width = width;
	me.height = height;
	me.static = false;
	me.grounded = false;
	me.tags = [];
	me.behaviors = [];

	me.addBehavior = function(behaviorFunction) {
		me.tags.push('behaves');
		me.behaviors.push(behaviorFunction);
	}

	gameObjects.push(me);
}

function Enemy(x, y, type) {
	GameObject.call(this, x, y, 50, 50);
	var me = this;
	me.fireRate = 1;
	me.tags.push("enemy");

	var lastAttack = new Date();

	me.think = function() {
		var currentTime = new Date();

		if(currentTime - lastAttack > 1000 / me.fireRate) {
			var missile = new GameObject(me.position.x, me.position.y, 20, 50);
			missile.addBehavior(function() {
				var differenceVector = player.position.subtract(missile.position);
				differenceVector = differenceVector.normalize();
				differenceVector = differenceVector.scale(20);
				missile.velocity = differenceVector;
				// missile.velocity.add(differenceVector);
			});

			me.position.x -= 1;
			lastAttack = currentTime;
		}
	}

}

function Vector2D(x, y) {
	var me = this;

	me.x = x;
	me.y = y;

	me.add = function(otherVector) {
		return new Vector2D(me.x + otherVector.x, me.y + otherVector.y);
	}

	me.subtract = function(otherVector) {
		return new Vector2D(me.x - otherVector.x, me.y - otherVector.y);
	}

	me.getMagnitude = function() {
		var magnitude = Math.sqrt(x*x + y*y);
		return magnitude;
	}

	me.normalize = function() {
		var magnitude = me.getMagnitude();
		return new Vector2D(me.x / magnitude, me.y / magnitude);
	}

	me.scale = function(amount) {
		return new Vector2D(me.x * amount, me.y * amount);
	}
}

window.addEventListener("mousedown", function(event) {
	var mousePosition = new Vector2D(event.clientX, -event.clientY);
	var projectile = new GameObject(player.position.x, player.position.y, 50, 50);
	var differenceVector = mousePosition.subtract(player.position);
	differenceVector = differenceVector.normalize();
	differenceVector = differenceVector.scale(10);
	projectile.velocity = differenceVector;
});

window.addEventListener("keydown", function(event) {
	if(event.keyCode == 87) {
		// W
		player.velocity.y = 10;
		player.grounded = false;
	} else if(event.keyCode == 65) {
		// A
		xMoveAxis = -1;
	} else if(event.keyCode == 68) {
		// D
		xMoveAxis = 1;
	} else if(event.keyCode == 83) {
		// S
	}
});

window.addEventListener("keyup", function(event) {
	if(event.keyCode == 87) {
		// W
	} else if(event.keyCode == 65) {
		// A
		xMoveAxis = 0;
	} else if(event.keyCode == 68) {
		// D
		xMoveAxis = 0;
	} else if(event.keyCode == 83) {
		// S
	}
});

var player = new GameObject(0, 0, 50, 50);
var enemy = new GameObject(50, -50, 70, 70);
var ground = new GameObject(0, -500, 1000, 20);
ground.static = true;
var ground = new GameObject(1000, -400, 1000, 20);
ground.static = true;
var enemy = new Enemy(500, 0, "missile");

function checkCollision(gameObjectA, gameObjectB) {
	var leftXA = gameObjectA.position.x;
	var rightXA = leftXA + gameObjectA.width;
	var topYA = gameObjectA.position.y;
	var bottomYA = topYA - gameObjectA.height;

	var leftXB = gameObjectB.position.x;
	var rightXB = leftXB + gameObjectB.width;
	var topYB = gameObjectB.position.y;
	var bottomYB = topYB - gameObjectB.height;

	if(rightXA < leftXB || rightXB < leftXA || bottomYA > topYB || bottomYB > topYA) {
		return false;
	} else {
		return true;
	}
}

function update() {
	tools.clearRect(0, 0, gameScreen.width, gameScreen.height);

	if(xMoveAxis == 0 && player.velocity.x != 0 && player.grounded) {
		if(player.velocity.x > 0) {
			player.velocity.x -= player.friction;
			if(player.velocity.x < 0) {
				player.velocity.x = 0;
			}
		}

		if(player.velocity.x < 0) {
			player.velocity.x += player.friction;
			if(player.velocity.x > 0) {
				player.velocity.x = 0;
			}
		}
	} else {
		player.velocity.x += xMoveAxis * playerSpeed;
	}

	if (player.position.y < -2000) {
		player.position = new Vector2D(0,0);
	}

	for(var objectIndex = 0; objectIndex < gameObjects.length; objectIndex++) {
		var gameObject = gameObjects[objectIndex];

		if(gameObject.tags.indexOf('behaves') != -1) {
			for(var behaviorIndex = 0; behaviorIndex < gameObject.behaviors.length; behaviorIndex++) {
				gameObject.behaviors[0]();
			}
		}

		if(gameObject.tags.indexOf('enemy') != -1) {
			gameObject.think();
		}

		var hittingStatic = false;

		for(var colliderIndex = 0; colliderIndex < gameObjects.length; colliderIndex++) {
			var colliderObject = gameObjects[colliderIndex];
			if(checkCollision(gameObject, colliderObject)) {
				if(colliderObject.static) {
					gameObject.grounded = true;
					gameObject.velocity.y = 0;
					hittingStatic = true;
				}
			}
		}

		gameObject.grounded = hittingStatic;

		// var hittingStatic = false;

		gameObject.position = gameObject.position.add(gameObject.velocity);

		if(!gameObject.static && !gameObject.grounded) {
			gameObject.velocity.y -= 0.3;
		}

		var drawX = gameObject.position.x;
		var drawY = gameObject.position.y;
		var offsetX = gameScreen.width / 2;
		var offsetY = gameScreen.height / 2;
		if(gameObject == player) {
			drawX = offsetX;
			drawY = -offsetY;
		} else {
			drawX = gameObject.position.x - player.position.x + offsetX;
			drawY = gameObject.position.y - player.position.y - offsetY;
		}

		tools.fillRect(drawX, -drawY, gameObject.width, gameObject.height);
	}

	setTimeout(update, 15);
}

update();

