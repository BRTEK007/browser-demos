var pos = 0;
var captions = [];
var strings = [];
var img;
var frame;

function main(){
    img = document.getElementById('icon_img');
    captions[0] = document.getElementById('caption0');
    captions[1] = document.getElementById('caption1');

    strings[0] = captions[0].innerHTML;
    strings[1] = captions[1].innerHTML;

    change_caption();
    setInterval(animation, 500);
}

function change_caption(){
   for(let i = 0; i < 2; i++){
       if(i == pos){
        captions[i].innerHTML = ">" + strings[i] + "<";
       }else{
           captions[i].innerHTML = strings[i];
       }
   }
}

function confirm(){
    console.log(pos);
    switch(pos){
        case 0:
            //window.open("game.html");
            window.location.href = 'game.html';
        break;
        case 1:
            s = ""
            alert("Controll godzilla with arrows\n" +
            "Pick up fallen bricks to inventory(left bottom corner)\n"+
            "Repair broken buildings using those bricks by walking by them\n"+
            "smash bomb placing humans\n" +
            "when destruction bar is filled up(right bottom corner) you loose");
        break;
    }
}

window.addEventListener("keydown", function (event) {
    if (event.defaultPrevented) {
      return;
    }
    switch (event.key) {
      case "ArrowDown":
        if(pos == 0)
            pos++;
        break;
      case "ArrowUp":
        if(pos == 1)
            pos--;
        break;
      case "Enter":
          confirm();
          break;
      default:
        return; // Quit when this doesn't handle the key event.
    }
    change_caption();
    event.preventDefault();
}, true);

function animation(){
    frame == 1 ? frame = 0 : frame = 1;
    if(frame == 0)
        img.src = 'img/icon2.png';
    else
        img.src = 'img/icon.png';
}