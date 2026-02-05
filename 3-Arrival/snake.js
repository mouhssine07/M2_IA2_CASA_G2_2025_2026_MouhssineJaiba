class Snake extends Vehicle {
    constructor(x, y, length, taille, couleur) {
        super(x, y);
        this.anneaux = [];
        this.couleur = couleur;
        this.r = taille;
        this.voirLangue = false;

        // Poids pour les comportements
        this.seekWeight = 0.2;
        this.avoidWeight = 2;
        this.boundariesWeight = 1;
        this.wanderWeight = 0;
        
        // On crée la tête du snake
        this.head = new Vehicle(x, y, this.couleur);
        this.anneaux.push(this.head);

        // On crée les anneaux suivants
        for (let i = 1; i < length; i++) {
            let anneau = new Vehicle(x - i * 20, y, this.couleur);
            this.anneaux.push(anneau);
        };

        // Il tire la langue toutes les 3 secondes
        setInterval(() => {
            this.voirLangue = true;
        }, 3000);
    }
    show() {
         if(this.voirLangue) {
            this.dessineLangue();
            // on remet voirLangue à false après un court instant
            setTimeout(() => {
                this.voirLangue = false; 
            }, 2000);
           
        }
        // On dessine la tête comme un cercle avec deux yeux
        this.dessineTete();
        // On dessine les anneaux
        this.dessineAnneaux();

       
    }
    
    dessineTete() {
        // On dessine la tête comme un cercle avec deux yeux
        // on tient compte du rayon this.r
       // les yeux doivent être bien positionnés et bien visibles
       // en contraste avec la couleur de la tête
       // et de bonne taille par rapport à this.r
       // rayon des yeux = this.r / 3
         push();
        fill(this.couleur);
        noStroke();
        circle(this.head.pos.x, this.head.pos.y, this.r);
        
        // yeux
        let eyeOffsetX = this.r / 6;
        let eyeOffsetY = this.r / 6;
        let eyeSize = this.r / 5;
        fill(255); // blanc des yeux
        circle(this.head.pos.x - eyeOffsetX, this.head.pos.y - eyeOffsetY, eyeSize);
        circle(this.head.pos.x + eyeOffsetX, this.head.pos.y - eyeOffsetY, eyeSize);
        
        fill(0); // pupilles
        let pupilSize = eyeSize / 2;
        circle(this.head.pos.x - eyeOffsetX, this.head.pos.y - eyeOffsetY, pupilSize);
        circle(this.head.pos.x + eyeOffsetX, this.head.pos.y - eyeOffsetY, pupilSize);
        
        pop();
        
    }

    dessineAnneaux() {
        // On dessine les anneaux comme des cercles
        // on part de l'index = 1 car l'index 0 est la tête

        // Entre chaque anneau on peut dessiner une ligne pour faire le corps
        // avec une certaine transparence. Plus on s'éloigne de la tête, plus la ligne est fine
        // au départ elle est à peine plus étroite que le diamètre de la tête
        for (let i = 1; i < this.anneaux.length; i++) {
            let anneau = this.anneaux[i];
            let anneauPrecedent = this.anneaux[i - 1];
            let rAnneau = this.r * (1 - i / (this.anneaux.length + 1));
            // ligne entre anneauPrecedent et anneau
            push();
            stroke(this.couleur);
            let alpha = map(i, 1, this.anneaux.length, 200, 50);
            strokeWeight(rAnneau * 0.8);
            stroke(this.couleur.levels[0], this.couleur.levels[1], this.couleur.levels[2], alpha);
            line(anneauPrecedent.pos.x, anneauPrecedent.pos.y, anneau.pos.x, anneau.pos.y);
            pop();
        }

        // puis on dessine les anneaux eux-mêmes
        // sans transparence. Plus on séloigne de la tête, plus l'anneau est petit
        for (let i = 1; i < this.anneaux.length; i++) {
            let anneau = this.anneaux[i];
            let rAnneau = this.r * (1 - i / (this.anneaux.length + 1));
            push();
            // Animation sur la couleur pour donner une impression
            // de vie au snake  
            // animation par rapport à sa couleur de base this.couleur
            // interpolation douce entre this.couleur et une couleur plus claire
            let time = frameCount * 0.05;
            let lerpFactor = (sin(time + i) + 1) / 2 * 0.5; // entre 0 et 0.5
            let couleurClair = color(
                min(this.couleur.levels[0] + 100, 255),
                min(this.couleur.levels[1] + 100, 255),
                min(this.couleur.levels[2] + 100, 255)
            );
            let couleurAnimee = lerpColor(this.couleur, couleurClair, lerpFactor);

            fill(couleurAnimee);            
            noStroke();
            circle(anneau.pos.x, anneau.pos.y, rAnneau);

            // et on veut un contour plus foncé autour de chaque anneau
            stroke(0);
            strokeWeight(2);
            noFill();
            circle(anneau.pos.x, anneau.pos.y, rAnneau);
            pop();
        } 
    }

    dessineLangue() {
        // langue de serpent fourchue au bout
        // rouge vif
        // dans la direction de this.vel
        // la langue est animée elle est dessinnée plus ou moins
        // longue en fonction de framecount, et sort et entre de la bouche
        let time = frameCount * 0.2;
        let longueurLangue = 10 + 10 * sin(time); // entre 0 et 20

        let direction = this.head.vel.copy();
        direction.normalize();
        direction.mult(this.r / 2); // partir du centre de la tête jusqu'à la bouche

        let baseLangue = p5.Vector.add(this.head.pos, direction);

        let langueEnd = p5.Vector.add(baseLangue, p5.Vector.mult(direction, longueurLangue / (this.r / 2)));

        // Dessin de la langue
        push();
        stroke(255, 0, 0);
        strokeWeight(4);
        line(baseLangue.x, baseLangue.y, langueEnd.x, langueEnd.y);

        // Dessin des deux fourches au bout de la langue
        let perp = createVector(-direction.y, direction.x);
        perp.normalize();
        perp.mult(5);

        line(langueEnd.x, langueEnd.y, langueEnd.x + perp.x, langueEnd.y + perp.y);
        line(langueEnd.x, langueEnd.y, langueEnd.x - perp.x, langueEnd.y - perp.y);
        pop();
    }

    applyBehaviors(target, obstacles=[]) {
        // La tête suit la cible
        // mais il ondule, donc il y a un petit déplacement sinusoïdal
        // perpendiculaire à la direction du mouvement
        //let forceSuivi = this.head.arrive(target, 20);
        let forceSuivi = this.head.arrive(target, 15);
        forceSuivi.mult(this.seekWeight);

        let forceBoundaries = this.head.boundaries(0, 0, width, height, 50);
        forceBoundaries.mult(this.boundariesWeight);

        let forceWander = this.head.wander();
        forceWander.mult(this.wanderWeight);
        /*
        let forceAvoid = this.head.avoid(obstacles);
        forceAvoid.mult(this.avoidWeight);
        */

        this.head.applyForce(forceSuivi);
        this.head.applyForce(forceBoundaries);
        this.head.applyForce(forceWander);
        // this.head.applyForce(forceAvoid);
        this.head.update();

        // On ajoute l'ondulation
        /*
        let time = frameCount * 0.1;
        let angle = time;
        let amplitude = 3; // amplitude de l'ondulation
        let offsetX = amplitude * sin(angle);
        let offsetY = amplitude * cos(angle);
        let direction = p5.Vector.sub(target, this.head.pos).normalize();
        let perp = createVector(-direction.y, direction.x); // vecteur perpendiculaire
        this.head.pos.x += perp.x * offsetX;
        this.head.pos.y += perp.y * offsetY;
*/

        // Chaque anneau suit l'anneau précédent
        for (let i = 1; i < this.anneaux.length; i++) {
            let anneau = this.anneaux[i];
            let anneauPrecedent = this.anneaux[i - 1];
            let forceSuivi = anneau.arrive(anneauPrecedent.pos, 15);
            forceSuivi.mult(2);
            
            
            // let forceAvoid = anneau.avoid(obstacles);
            // forceAvoid.mult(this.avoidWeight);
            anneau.applyForce(forceSuivi);
            // anneau.applyForce(forceAvoid);
            anneau.update();
        }
    }
}