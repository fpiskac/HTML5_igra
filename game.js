// Učitavanje Canvas objekta i konteksta
var platno = document.getElementById("gameCanvas");
var crtac = platno.getContext("2d");

//zvukovi
var zvuk_cigla = document.getElementById("zvuk_cigla");
var zvuk_palica = document.getElementById("zvuk_palica");
var zvuk_rub = document.getElementById("zvuk_rub");
var zvuk_start = document.getElementById("zvuk_start");
var zvuk_gameover = document.getElementById("zvuk_gameover");
var zvuk_win = document.getElementById("zvuk_win");
var zvuk_bonus = document.getElementById("zvuk_bonus");


// Konstante igre -- broj cigli
var REDOVI_CIGLI = 5;
var STUPCI_CIGLI = 10;
var UKUPNO_CIGLI = REDOVI_CIGLI * STUPCI_CIGLI;

// Dimenzije cigli i razmaci
var sirina_cigle = 80;
var visina_cigle = 25;
var razmak_cigli_x = 30;  // horizontalni
var razmak_cigli_y = 15;  // vertikalni
var pomak_gore = 40;
var pomak_lijevo = 40;

// Dimenzije i početna pozicija palice
var visina_palice = 12;
var sirina_palice = 90;
var pozicija_palice_x = (platno.width - sirina_palice) / 2;

// Loptica – pozicija, veličina i početna brzina
var velicina_loptice = 12;
var pozicija_lopte_x = platno.width / 2;
var pozicija_lopte_y = platno.height - 60;
var brzina_lopte_x = 4;
var brzina_lopte_y = -4;

// Praćenje tipki za upravljanje palicom
var tipka_desno = false;
var tipka_lijevo = false;

// Rezultati i stanje igre
var trenutni_rezultat = 0;
var najbolji_rezultat = localStorage.getItem("breakout_best") || 0;

// Logičke zastavice
var igra_pocela = false;
var poraz = false;
var pobjeda = false;


// Matrica za spremanje svih cigli
var matrica_cigli = [];

// Funkcija koja generira sve cigle na početku igre
function generiraj_cigle_action() {
    for (var r = 0; r < REDOVI_CIGLI; r++) {
        matrica_cigli[r] = [];
        for (var c = 0; c < STUPCI_CIGLI; c++) {
            matrica_cigli[r][c] = { x: 0, y: 0, status: 1 };
        }
    }
}
generiraj_cigle_action(); // Poziv funkcije za kreiranje cigli

// Funkcija za iscrtavanje jedne cigle s 3D efektom
function iscrtaj_ciglu_action(cigla, boja) {
    var g = crtac.createLinearGradient(cigla.x, cigla.y, cigla.x, cigla.y + visina_cigle);
    g.addColorStop(0, "white"); // svjetliji vrh
    g.addColorStop(0.15, boja); // sredina - originalna boja
    g.addColorStop(0.85 , boja);
    crtac.shadowBlur = 25;
    crtac.shadowColor = "black"; 
    g.addColorStop(1, "black");  // tamniji rub dolje

    // Popuni ciglu gradijentom
    crtac.fillStyle = g;
    crtac.fillRect(cigla.x, cigla.y, sirina_cigle, visina_cigle);

    crtac.strokeStyle = "rgba(0,0,0,0.4)";
    crtac.strokeRect(cigla.x, cigla.y, sirina_cigle, visina_cigle);
}


// Iscrtavanje svih cigli
function iscrtaj_sve_cigle_action() {
    for (var r = 0; r < REDOVI_CIGLI; r++) {
        for (var c = 0; c < STUPCI_CIGLI; c++) {

            if (matrica_cigli[r][c].status === 1) {
                var cigla_x = c * (sirina_cigle + razmak_cigli_x) + pomak_lijevo;
                var cigla_y = r * (visina_cigle + razmak_cigli_y) + pomak_gore;

                matrica_cigli[r][c].x = cigla_x;
                matrica_cigli[r][c].y = cigla_y;

                var boja = "";
                if (r === 0) boja = "rgb(153,51,0)";
                if (r === 1) boja = "rgb(255,0,0)";
                if (r === 2) boja = "rgb(255,153,204)";
                if (r === 3) boja = "rgb(0,255,0)";
                if (r === 4) boja = "rgb(255,255,153)";

                iscrtaj_ciglu_action(matrica_cigli[r][c], boja);
            }
        }
    }
}


// Iscrtavanje palice
function iscrtaj_palicnu_letvu_action() {
    var gx = crtac.createLinearGradient(pozicija_palice_x, platno.height - visina_palice - 10,
                                        pozicija_palice_x, platno.height - 10);
    gx.addColorStop(0, "#ffffff"); // vrh (skoro bijelo)
    gx.addColorStop(1, "#8a8a8aff"); // dno (lagano tamnije)

    crtac.fillStyle = gx;
    crtac.fillRect(pozicija_palice_x, platno.height - visina_palice - 10, sirina_palice, visina_palice);
    
    crtac.strokeStyle = "rgba(0,0,0,0.4)";
    crtac.strokeRect(pozicija_palice_x, platno.height - visina_palice - 10, sirina_palice, visina_palice);
}


// Iscrtavanje loptice
function iscrtaj_lopticu_action() {
    var lg = crtac.createLinearGradient(pozicija_lopte_x, pozicija_lopte_y, pozicija_lopte_x + velicina_loptice, pozicija_lopte_y + velicina_loptice);
    lg.addColorStop(0, "#ffffff");
    lg.addColorStop(1, "#dcdcdc");

    crtac.fillStyle = lg;
    crtac.fillRect(pozicija_lopte_x, pozicija_lopte_y, velicina_loptice, velicina_loptice);

    crtac.strokeStyle = "rgba(0,0,0,0.4)";
    crtac.strokeRect(pozicija_lopte_x, pozicija_lopte_y, velicina_loptice, velicina_loptice);
}


// Detekcija kolizija s ciglama
function detekcija_cigli_action() {
    for (var r = 0; r < REDOVI_CIGLI; r++) {
        for (var c = 0; c < STUPCI_CIGLI; c++) {

            var cig = matrica_cigli[r][c];
            if (cig.status === 1) {

                if ( //ako loptica dodiruje ciglu
                    pozicija_lopte_x < cig.x + sirina_cigle &&
                    pozicija_lopte_x + velicina_loptice > cig.x &&
                    pozicija_lopte_y < cig.y + visina_cigle &&
                    pozicija_lopte_y + velicina_loptice > cig.y
                ) {//makni ciglu,povećaj rez, promijeni putanju loptice
                    zvuk_cigla.currentTime = 0;  
                    zvuk_cigla.play();
                    cig.status = 0;
                    trenutni_rezultat += 1;
                    //bonus sound kada dođe do okruglog broja bodova
                    if (trenutni_rezultat % 10 === 0) {
                        zvuk_bonus.currentTime = 0;
                        zvuk_bonus.play();
                    }

                    // Provjera udarca u kut cigle
                    if (udarac_u_kut_action(pozicija_lopte_x, pozicija_lopte_y, velicina_loptice, cig)) {

                        if (brzina_lopte_y > 0) brzina_lopte_y += 0.5;
                        else brzina_lopte_y -= 1;

                    } else {
                        // Udarac po sredini – normalan odskok
                        brzina_lopte_y = -brzina_lopte_y;
                    }

                    //ažuriraj rezultat
                    if (trenutni_rezultat > najbolji_rezultat) {
                        najbolji_rezultat = trenutni_rezultat;
                        localStorage.setItem("breakout_best", najbolji_rezultat);
                    }
                    //ako su srušene sve cigle završi igru
                    if (trenutni_rezultat === UKUPNO_CIGLI) {
                        pobjeda = true;
                    }
                }
            }
        }
    }
}
//funkcija vraća true ako loptica udara u kut false ako ne
function udarac_u_kut_action(ballX, ballY, ballSize, brick) {

    var kut1 = { x: brick.x, y: brick.y };
    var kut2 = { x: brick.x + sirina_cigle, y: brick.y };
    var kut3 = { x: brick.x, y: brick.y + visina_cigle };
    var kut4 = { x: brick.x + sirina_cigle, y: brick.y + visina_cigle };

    // Provjeri svaki kut je li unutar loptice
    function je_unutar_kvadrata(kut) {
        return (
            kut.x >= ballX &&
            kut.x <= ballX + ballSize &&
            kut.y >= ballY &&
            kut.y <= ballY + ballSize
        );
    }

    return (
        je_unutar_kvadrata(kut1) ||
        je_unutar_kvadrata(kut2) ||
        je_unutar_kvadrata(kut3) ||
        je_unutar_kvadrata(kut4)
    );
}



// Upravljanje palicom
function pomakni_palicnu_letvu_action() {
    if (tipka_desno && pozicija_palice_x < platno.width - sirina_palice) { //ako pritisneš desno i plaica nije na kraju ekrana pomakni
        pozicija_palice_x += 7;
    } else if (tipka_lijevo && pozicija_palice_x > 0) { //isto za lijevo
        pozicija_palice_x -= 7;
    }
}


// Prikaz rezultata
function iscrtaj_rezultate_action() {
    crtac.font = "16px Helvetica";
    crtac.fillStyle = "white";
    crtac.textAlign = "left";
    crtac.fillText("Score: " + trenutni_rezultat, 20, 20);

    crtac.textAlign = "right";
    crtac.fillText("Best: " + najbolji_rezultat, platno.width - 100, 20);

}


// Prvi ekran
function prikazi_start_ekran_action() {
    crtac.font = "bold 36px Helvetica";
    crtac.fillStyle = "white";
    crtac.textAlign = "center";

    crtac.fillText("BREAKOUT", platno.width / 2, platno.height / 2 - 20);

    crtac.font = "italic bold 18px Helvetica";
    crtac.fillText("Press SPACE to begin", platno.width / 2, platno.height / 2 + 10);
}


// GAME OVER ekran
function prikazi_kraj_igre_action() {
    zvuk_gameover.currentTime = 0;
    zvuk_gameover.play();
    crtac.font = "bold 40px Helvetica";
    crtac.fillStyle = "yellow";
    crtac.textAlign = "center";
    crtac.fillText("GAME OVER", platno.width / 2, platno.height / 2);
}


// Ekran pobjede
function prikazi_pobjedu_action() {
    zvuk_win.currentTime = 0;
    zvuk_win.play();
    crtac.font = "40px Helvetica";
    crtac.fillStyle = "yellow";
    crtac.textAlign = "center";
    crtac.fillText("YOU WIN!", platno.width / 2, platno.height / 2);
}


// Glavna petlja igre
function glavna_petlja_action() {

    if (!igra_pocela) { //ako igra nije počela očisti ctx i pokaži start_screen
        crtac.clearRect(0, 0, platno.width, platno.height);
        prikazi_start_ekran_action();
        requestAnimationFrame(glavna_petlja_action);
        return;
    }

    if (pobjeda) {
        crtac.clearRect(0, 0, platno.width, platno.height);
        prikazi_pobjedu_action();
        return;
    }

    if (poraz) {
        crtac.clearRect(0, 0, platno.width, platno.height);
        prikazi_kraj_igre_action();
        return;
    }


    crtac.clearRect(0, 0, platno.width, platno.height);

    iscrtaj_sve_cigle_action();
    iscrtaj_lopticu_action();
    iscrtaj_palicnu_letvu_action();
    iscrtaj_rezultate_action();

    detekcija_cigli_action();
    pomakni_palicnu_letvu_action();

    // Sudar s rubovima ekrana
    if (pozicija_lopte_x + brzina_lopte_x < 0 || pozicija_lopte_x + brzina_lopte_x > platno.width - velicina_loptice) {
        brzina_lopte_x = -brzina_lopte_x;
        zvuk_rub.currentTime = 0;
        zvuk_rub.play();
    }
    if (pozicija_lopte_y + brzina_lopte_y < 0) {
        brzina_lopte_y = -brzina_lopte_y;
        zvuk_rub.currentTime = 0;
        zvuk_rub.play();

    }

    // Sudar s palicom
    if (
        pozicija_lopte_y + velicina_loptice >= platno.height - visina_palice - 10 &&
        pozicija_lopte_x + velicina_loptice > pozicija_palice_x &&
        pozicija_lopte_x < pozicija_palice_x + sirina_palice
    ) {
        zvuk_palica.currentTime = 0;
        zvuk_palica.play();

        brzina_lopte_y = brzina_lopte_y ? -4 : 4;

        var dist = (pozicija_lopte_x + velicina_loptice/2) - (pozicija_palice_x + sirina_palice/2);

        // normalizacija (vrijednost između -1 i 1)
        var normal = dist / (sirina_palice/2);

        // horizontalna brzina ovisi o mjestu udarca
        brzina_lopte_x = normal * 5; // max brzina 5 px/frame
        }

        // Loptica izašla → kraj
        if (pozicija_lopte_y + velicina_loptice > platno.height) {
            poraz = true;
        }
        //pomicanje loptice
        pozicija_lopte_x += brzina_lopte_x;
        pozicija_lopte_y += brzina_lopte_y;

    requestAnimationFrame(glavna_petlja_action);
}


// Detekcija tipki
document.addEventListener("keydown", function (e) {
    if (e.code === "ArrowRight") tipka_desno = true;
    if (e.code === "ArrowLeft") tipka_lijevo = true;

    if (e.code === "Space" && !igra_pocela) {
    zvuk_start.play();
    igra_pocela = true;
    // Nasumični smjer X komponente: -4 ili 4
    brzina_lopte_x = Math.random() < 0.5 ? -4 : 4;

    // Y komponenta prema zadatku mora biti -4 da ide prema gore
    brzina_lopte_y = -4;

    igra_pocela = true;
}

});

document.addEventListener("keyup", function (e) {
    if (e.code === "ArrowRight") tipka_desno = false;
    if (e.code === "ArrowLeft") tipka_lijevo = false;
});

// Pokretanje animacije
glavna_petlja_action();