let PaprikaApi = require('paprika-api').PaprikaApi;

let paprikaApi = new PaprikaApi('emmylou491@gmail.com', 'angel4591');

paprikaApi.recipes().then((recipes) => {
    paprikaApi.recipe(recipes[0].uid).then((recipe) => {
        console.log(recipe);
    });
});

function save_paprika_recipe() {
    var d = document;
    if (!d.body) return;
    try {
        var s = d.createElement("scr" + "ipt");
        s.setAttribute(
            "src",
            d.location.protocol +
                "//paprikaapp.com/bookmarklet/v1/?token=cf6c43713322da9f&timestamp=" +
                new Date().getTime()
        );
        d.body.appendChild(s);
    } catch (e) {}
}
save_paprika_recipe();
void 0;