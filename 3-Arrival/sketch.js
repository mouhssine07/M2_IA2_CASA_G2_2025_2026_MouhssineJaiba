let nbVehicules = 20;
let target;
let vehicle;
let vehicles = [];
let vehiclesWander = [];
let snakes = [];

// Texte
let font;
let points = [];
// mode (snake ou text)
let mode = "snake";

// Appelée avant de démarrer l'animation
function preload() {
  // en général on charge des images, des fontes de caractères etc.
  font = loadFont('./assets/inconsolata.otf');
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // On crée un véhicule à la position (100, 100)
  vehicle = new Vehicle(100, 100);

  // La cible, ce sera la position de la souris
  target = createVector(random(width), random(height));

  // Texte qu'on affiche avec textToPoint
  // Get the point array.
  // parameters are : text, x, y, fontSize, options. 
  // sampleFactor : 0.01 = gros points, 0.1 = petits points
  // ca représente la densité des points
  points = font.textToPoints('Hello!', 350, 250, 305, { sampleFactor: 0.03 });

  // on cree des vehicules, autant que de points
  nbVehicules = points.length;
  for (let i = 0; i < nbVehicules; i++) {
    let v = new Vehicle(random(width), random(height));
    vehicles.push(v);
  }


}

// appelée 60 fois par seconde
function draw() {
  // couleur pour effacer l'écran
  background(0);
  // pour effet psychedelique
  //background(0, 0, 0, 10);

  // On affiche le texte avec des cercles définis par le tableau points
  points.forEach(pt => {
    push();
    fill("grey");
    noStroke();
    circle(pt.x, pt.y, 15);
    pop();
  });



  // On affiche les snakes, qui suivent la souris
  // Calcul de positions derrière la souris, comme si on faisait 
  // une "formation d'avions" derrière la souris. Par exemple
  // formation en V avec un certain espacement. On va définir 7 cibles
  // derrière la souris, la souris étant la tête de la formation
  // la cible 0 est 30 pixels derrière la souris, les cibles 1 et 2 sont derrière et à gauche et à droite
  // par rapport à la direction du mouvement de la souris, etc.
  // les cibles sont DERRIERE la souris quand elle se déplace
  // Lorsque la souris est immobile (previousMouseX == mouseX et previousMouseY == mouseY avec une certaine
  // tolérance), les cibles restent à leur position précédente
  let formationTargets = [];
  let numFormationTargets = 7;
  let spacing = 30;

  // Calcul de la direction du mouvement de la souris
  let mouseVel = createVector(mouseX - pmouseX, mouseY - pmouseY);
  if (mouseVel.mag() < 0.1) {
    mouseVel.set(0, -1); // si la souris est immobile, on considère qu'elle regarde vers le haut
  } else {
    mouseVel.normalize();
  }

  // Vecteur perpendiculaire à la direction du mouvement de la souris
  let perp = createVector(-mouseVel.y, mouseVel.x);

  for (let i = 0; i < numFormationTargets; i++) {
    let targetPos = createVector(mouseX, mouseY);
    targetPos.sub(p5.Vector.mult(mouseVel, spacing * (floor(i / 2) + 1))); // derrière la souris
    if (i % 2 == 1) {
      targetPos.add(p5.Vector.mult(perp, spacing * (floor(i / 2) + 1))); // à gauche  
    } else if (i % 2 == 0 && i != 0) {
      targetPos.sub(p5.Vector.mult(perp, spacing * (floor(i / 2)))); // à droite
    }
    formationTargets.push(targetPos);
  }

  // Dessin sous forme de cercles de rayon 10 des formationTargets
  if (Vehicle.debug) {
    formationTargets.forEach(target => {
      push();
      fill("grey");
      noStroke();
      circle(target.x, target.y, 15);
      pop();
    });
  }

  snakes.forEach((snake, index) => {
    let cible = formationTargets[index % formationTargets.length];
    snake.applyBehaviors(cible);
    // snake.applyBehaviors(target, obstacles);
    snake.show();
  });


  switch (mode) {
    case "snake":
      // Cible qui suit la souris, cercle rouge de rayon 32
      target.x = mouseX;
      target.y = mouseY;

      // dessin de la cible
      push();
      fill(255, 0, 0);
      noStroke();
      ellipse(target.x, target.y, 32);
      pop();

      vehicles.forEach((vehicle, index) => {
        // si on a affaire au premier véhicule
        // alors il suit la souris (target)
        let steeringForce;

        if (index === 0) {
          // le premier véhicule suit la souris avec arrivée
          steeringForce = vehicle.arrive(target);
          //steeringForce = vehicle.wander();
        } else {
          // Je suis un suiveur, je poursuis le véhicule 
          // précédent avec arrivée
          let vehiculePrecedent = vehicles[index - 1];
          steeringForce = vehicle.arrive(vehiculePrecedent.pos, 30);
        }

        vehicle.applyForce(steeringForce);
        vehicle.update();
        vehicle.show();
      })
      break;
    case "text":
      vehicles.forEach((vehicle, index) => {
        // chaque véhicule vise un point du texte
        let pt = points[index];
        let target = createVector(pt.x, pt.y);
        let steeringForce = vehicle.arrive(target);
        vehicle.applyForce(steeringForce);
        vehicle.update();
        vehicle.show();
      });
      break;
  }

  // Affichage des véhicules en mode wander
  vehiclesWander.forEach(vehicle => {
    let force = vehicle.wander();
    vehicle.applyForce(force);
    vehicle.update();
    vehicle.show();
    vehicle.edges();
  });

}


function keyPressed() {
  if (key === 'd') {
    Vehicle.debug = !Vehicle.debug;
  } else if (key === 'w') {
    // Je crée un nouveau véhicule en mode wander
    let v = new VehicleWander(random(width), random(height));
    v.r = 60; // plus grand
    v.couleur = color(0, 255, 0); // vert
    vehiclesWander.push(v);
  } else if (key === 's') {
    // Mode = Snake
    mode = "snake";
  } else if (key === 't') {
    // Mode = Text
    mode = "text";
  } else if (key === 'a') {
    // on va créer une instance de la classe Snake
    // qui va gérer elle-même son tableau de véhicules
    // et son comportement de snake
    // TODO
    // couleur random
    let couleur = color(random(255), random(255), random(255));
    // taille random entre 10 et 50
    let taille = random(10, 50);
    // longueur random entre 5 et 30
    let length = floor(random(5, 30));
    let snake = new Snake(mouseX, mouseY, length, taille, couleur);
    snakes.push(snake);


    if (snakes.length > 1) {
      // Le premier snake suivra la souris, mais les autres ne feront
      // que du wander et du boundaries
      snake.seekWeight = 0;
      snake.wanderWeight = 2;
      
      snake.head.maxSpeed = 1.5;
      snake.head.maxForce = 0.05;
      snake.head.displaceRange = 0.1
      snake.head.wanderRadius = 50;
    }
  }
}