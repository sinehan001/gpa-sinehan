$(".images").attr("style",arr[0]);
let valueX = [];
let valueY = [];
let a = 1;
var img = document.getElementsByClassName("images")[0];
img.classList.add("anime");
function coord(event) {
    img.classList.remove("anime");
    setTimeout(()=>{
        $(".images").attr("style",arr[a]);
        a++;
        var c = event.offsetX;
        var d = event.offsetY;
        valueX.push(c);
        valueY.push(d);
        if(a==4){
            document.getElementById("Btn").disabled = false;
            img.onclick=null;
            $(".coordX").attr("value",valueX.toString());
            $(".coordY").attr("value",valueY.toString());
        }
        else {
            setTimeout(()=>{img.classList.add("anime");},10);
        }
    },10);
}

// function createRipple(event) {
//     const button = event.currentTarget;

//     const circle = document.createElement("span");
//     const diameter = Math.max(button.clientWidth, button.clientHeight);
//     const radius = diameter / 2;

//     circle.style.width = circle.style.height = `${diameter}px`;
//     circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
//     circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
//     circle.classList.add("ripple");

//     const ripple = button.getElementsByClassName("ripple")[0];

//     if (ripple) {
//         ripple.remove();
//     }

//     button.appendChild(circle);
// }

// const btn = document.getElementsByClassName('images');
// for (const bt of btn) {
//     bt.addEventListener("click", createRipple);
// }