let github_general = document.getElementById("github");
let uaic_general = document.getElementById("uaic");


function opa_over(event){
    event.target.style.opacity = "100%";
}

function opa_out(event){
    event.target.style.opacity = "60%";
}

github_general.addEventListener("mouseover",opa_over);
github_general.addEventListener("mouseout",opa_out);
uaic_general.addEventListener("mouseover",opa_over);
uaic_general.addEventListener("mouseout",opa_out);

github_general.addEventListener("click", function(){
    window.open('https://github.com/NovioAlexandruRosca/Proiect-Web-2024-HeMa-',"_blank");
});

uaic_general.addEventListener("click", function(){
    window.open('https://www.info.uaic.ro',"_blank");
});