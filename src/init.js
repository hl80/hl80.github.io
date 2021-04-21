var config = {
  type: Phaser.AUTO,
  width: 1366,
  height: 768,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  autoRound: false,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  }
}

var game = new Phaser.Game(config);
var screenWidth = 0;
var screenHeight = 0;

function preload() {
  this.load.image('boat', 'assets/boat3.png');
  this.load.image('sky', 'assets/sky.png');
  this.load.image('bubble', 'assets/bubble.png');
  this.load.image('sailor', 'assets/sailor.png');
  this.load.image('hook', 'assets/fishinghook.png');
  this.load.image('up', 'assets/up.png');
  this.load.image('down', 'assets/down.png');
  this.load.image('fish', 'assets/fish2.png');
  this.load.image('shark', 'assets/shark2.png');
  this.load.image('gameover', 'assets/gameover.png');
  this.load.image('restart', 'assets/restart.png');
}

function initBubbles(scene, interval, speed, lifetime, deadLine, width, height) {
  var bubbles = [];
  var time = interval;
  update = function (dt) {
    for (index = bubbles.length - 1; index >= 0; index -= 1) {
      var elem = bubbles[index];
      elem['image'].y -= elem['speed']* dt;
      elem['timeLeft'] -= dt;
      if (elem['image'].y < deadLine | elem['timeLeft'] < 0) {
	elem['image'].destroy();
	bubbles.splice(index, 1);
      }
    }
    time -= dt;
    if (time < 0 && bubbles.length < 25) {
      var x = Phaser.Math.RND.frac();
      x *= width;
      var y = Phaser.Math.RND.frac();
      y = deadLine + y * height;
      var sp = Phaser.Math.RND.frac();
      sp *= speed;
      sp += speed;
      var lt = Phaser.Math.RND.frac();
      lt *= lifetime;
      lt += lifetime;
      var bubble = {
	'image': scene.add.image(x, y, 'bubble'),
	'timeLeft': lt,
	'speed' : sp,
      }
      bubble['image'].setOrigin(0, 0);
      bubble['image'].displayWidth = 75;
      bubble['image'].displayHeight = 75;
      bubbles.push(bubble)
      time = interval;
    }
  }
  return update;
}

var running = true;

function initFishes(scene, interval, speed, deadLine, width, height, hook, addScore, sharkProb) {
  var fishes = [];
  var sharks = [];
  var time = interval;
  update = function (dt) {
    for (index = fishes.length - 1; index >= 0; index -= 1) {
      var elem = fishes[index];
      elem['image'].x -= elem['speed']* dt;
      if ((elem['image'].x < -elem['image'].width) || elem['dead']) {
	elem['image'].destroy();
	fishes.splice(index, 1);
      }
    }
    for (index = sharks.length - 1; index >= 0; index -= 1) {
      var elem = sharks[index];
      elem['image'].x -= elem['speed']* dt;
      elem['angle'] -= elem['angspeed']* dt;
      elem['image'].y = (Math.sin(elem['angle'] * 3.1416/180.0) * height/2) + (deadLine + height/2);
      if ((elem['image'].x < -elem['image'].width)) {
	elem['image'].destroy();
	sharks.splice(index, 1);
      }
    }
    time -= dt;
    if (time < 0 && fishes.length < 25) {
      var isFish = Phaser.Math.RND.frac();
      if(isFish> sharkProb) {
	var y = Phaser.Math.RND.frac();
	y = deadLine + y * height;
	var sp = Phaser.Math.RND.frac();
	sp *= speed;
	sp += speed;
	sp = speed;
	var fish = {
	  'image': scene.physics.add.image(width, y, 'fish'),
	  'speed' : sp,
	  'dead' : false,
	}
	fish['image'].setOrigin(0, 0);
	scene.physics.add.overlap(hook, fish['image'], function() { 
	  if(! fish['dead']) {
	    fish['dead'] = true;
	    addScore();
	  }
	});
	//bubble['image'].displayWidth = 75;
	//bubble['image'].displayHeight = 75;
	fishes.push(fish);
      }
      else {
	var y = Phaser.Math.RND.frac();
	y = deadLine + y * height;
	sp = speed * 2.5;
	var ph = Phaser.Math.RND.frac() * 360;
	var shark = {
	  'image': scene.physics.add.image(width, y, 'shark'),
	  'speed' : sp,
	  'angle' : 360 + ph,
	  'angspeed' : 180,
	}
	shark['image'].setOrigin(0, 0);
	scene.physics.add.overlap(hook, shark['image'], function() {
	  if(running) {
	    running = false;
	    var gameover = scene.add.image(screenWidth/2, screenHeight/2, 'gameover');
	    gameover.displayWidth = screenHeight;
	    gameover.displayHeight = screenHeight;
	    var restart = scene.add.image(screenWidth/2, screenHeight*0.8, 'restart');
	    restart.displayWidth = 200;
	    restart.displayHeight = 200;
	    restart.setInteractive();
	    restart.on('pointerdown', function() {
	      running = true;
	      scene.scene.restart();
	    });
	  }
	});
	//bubble['image'].displayWidth = 75;
	//bubble['image'].displayHeight = 75;
	sharks.push(shark);
      }
      
      time = interval;
    }
  }
  return update;
}

var bubbleFunc;
var hookFunc;
var fishFunc;

function create() {
  var width = this.cameras.main.displayWidth;
  var height = this.cameras.main.displayHeight;
  screenWidth = width;
  screenHeight = height;

  var data = {
    'score' : 0,
  }

  var skyImage = this.add.image(0, 0, 'sky');
  skyImage.setOrigin(0, 0);

  var sailorImage = this.add.image(0, 0, 'sailor');
  sailorImage.setOrigin(0, 0);

  var boatImage = this.add.image(0, 0, 'boat');
  boatImage.setOrigin(0, 0);

  var waterLevel = height/2;
  var boatpos= waterLevel - boatImage.height/2;

  sailorImage.y = boatpos - sailorImage.height/1.5;
  sailorImage.x = boatImage.width - sailorImage.width/2;

  bubbleFunc = initBubbles(this, 0.4, 50, 1.5, height/2, width, height - (boatpos + boatImage.height));

  boatImage.y = boatpos;

  this.add.rectangle(0, waterLevel, width, height - waterLevel, 0x1b95e0).setOrigin(0, 0);

  var hookLevel = 0;
  var horizontalDisplace = sailorImage.width;
  var hookImage = this.physics.add.image(0, 0, 'hook');
  var fishgroup = this.physics.add.group();
  var line = this.add.rectangle(sailorImage.x + horizontalDisplace - 2.5, sailorImage.y, 5, 1, 0x0).setOrigin(0, 0);
  hookImage.setOrigin(0, 0);
  var upArrow = this.input.keyboard.addKey('w');
  var downArrow = this.input.keyboard.addKey('s');
  var hookAcc = 4000;
  var hookSpeed = 0;


  var upDown = false;
  var upButton = this.add.image(0, 0, 'up');
  upButton.setOrigin(0, 0);
  upButton.x = width - upButton.width;
  upButton.y = height/2 - (upButton.height + 100);
  //upButton.setInteractive(new Phaser.Geom.Rectangle(0, 0, 1000, 1000), Phaser.Geom.Rectangle.Contains);
  //scene.input.setHitAreaRectangle([upButton], -100, -100, upButton.width+100, upButton.height+100);
  //upButton.setInteractive();
  upButton.setInteractive(new Phaser.Geom.Rectangle(-upButton.width, -(height/2 - (upButton.height + 100)), 2*upButton.width, height/2), Phaser.Geom.Rectangle.Contains);
  upButton.on('pointerdown', function(pointer) {
    if(pointer.isDown && running)
      upDown = true;
  });
  upButton.on('pointerup', function() {
    if(running)
      upDown = false;
  });
  upButton.on('pointerout', function() {
    if(running)
      upDown = false;
  });


  var downDown = false;
  var downButton = this.add.image(0, 0, 'down');
  downButton.setOrigin(0, 0);
  downButton.x = width - downButton.width;
  downButton.y = height/2 + 100;
  downButton.setInteractive(new Phaser.Geom.Rectangle(-downButton.width, -100, 2*downButton.width, height/2), Phaser.Geom.Rectangle.Contains);
  downButton.on('pointerdown', function(pointer) {
    if(pointer.isDown && running)
      downDown = true;
  });
  downButton.on('pointerout', function() {
    if(running)
      downDown = false;
  });
  downButton.on('pointerup', function() {
    if(running)
      downDown = false;
  });

  hookFunc = function (dt) {
    if(upArrow.isDown | upDown) {
      if(hookLevel > 0) {
	hookSpeed -= hookAcc * dt;
	
      }
    }
    else if(downArrow.isDown | downDown) {
      if((hookLevel + waterLevel) < height) {
	hookSpeed += hookAcc * dt;
	
      }
    }
    else {
      if(Math.abs(hookSpeed ) > 0) {
	hookSpeed *= (1.0 - (5.0 * dt));
	if (Math.abs(hookSpeed) < 1.0)
	  hookSpeed = 0;
      }
    }
    if(Math.abs(hookSpeed ) > 0.1) {
      hookLevel += hookSpeed*dt;
      if(hookLevel < 0) {
	hookLevel = 0;
	hookSpeed = 0;
      }
      if((hookLevel + waterLevel + 56)> height) {
	hookLevel = height - waterLevel - 56;
	hookSpeed = 0;
      }
    }
    hookImage.x = sailorImage.x + horizontalDisplace - 14;
    hookImage.y = waterLevel + hookLevel - 7;
    line.height = (hookLevel + waterLevel) - sailorImage.y;
  }

  var score = this.add.text(width - 200, 20, '0', { fixedWidth: 180, fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif' , fontSize: 96, align: "right"});
  var addScore = function () {
    data['score'] += 1;
    score.text = data['score'].toString();
  }
  fishFunc = initFishes(this, 1, 250, height/2, width, height - (boatpos + boatImage.height), hookImage, addScore, 0.3);
}

function getTime() {
  var d = new Date();
  return d.getTime();
}

var time = getTime();

function update() {
  var newTime = getTime();
  var dt = (newTime - time)/1000.0
  if (!running)
    dt = 0;
  bubbleFunc(dt);
  hookFunc(dt);
  fishFunc(dt);
  time = newTime;
}
