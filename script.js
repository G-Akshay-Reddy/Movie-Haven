const API_KEY='api_key=f491f6040ae30446807e51cc255e1d15';
const BASE_URL='https://api.themoviedb.org/3';
const API_URL=BASE_URL+'/discover/movie?sort_by=popularity.desc&'+API_KEY;
const IMG_URL = 'https://image.tmdb.org/t/p/w500/';
const SEARCH_URL=BASE_URL+'/search/movie?'+API_KEY;
const main = document.getElementById('main');
const form = document.getElementById('form');
const search = document.getElementById('search');

getMovies(API_URL);


function getMovies(url)
{
  fetch(url).then(res=>res.json()).then(data =>{
    console.log(data.results);
    showMovies(data.results);
  })
}

function getTVShows(url)
{
  fetch(url).then(res=>res.json()).then(data =>{
    showTVShows(data.results);
  })
}
 
function showMovies(data)
{

  main.innerHTML='';
  data.forEach(movie => {

    const {title, poster_path, vote_average , overview} = movie;
    const movieEl=document.createElement('div');
    movieEl.classList.add('movie');
    movieEl.innerHTML=`
      <img src="${IMG_URL+poster_path}" alt="${title}">

            <div class="movie-info">
                <h3>${title}</h3>
                <span class="green">${vote_average}</span>
            </div>

            <div class="overview">
              <h2>${title}</h2>
                <h3>Synopsis : </h3>
                ${overview}
            </div>



    `
    main.appendChild(movieEl)
    
  });


}

function showTVShows(data)
{

  main.innerHTML='';
  data.forEach(movie => {

    const {name, poster_path, vote_average , overview} = movie;
    const movieEl=document.createElement('div');
    movieEl.classList.add('movie');
    movieEl.innerHTML=`
      <img src="${IMG_URL+poster_path}" alt="${name}">

            <div class="movie-info">
                <h3>${name}</h3>
                <span class="green">${vote_average}</span>
            </div>

            <div class="overview">
              <h2>${name}</h2>
                <h3>Synopsis : </h3>
                ${overview}
            </div>



    `
    main.appendChild(movieEl)
    
  });


}

form.addEventListener('submit', (e) => { 
  e.preventDefault();

  const searchTerm = search.value;
  if(searchTerm){
    getMovies(SEARCH_URL+'&query='+searchTerm);
  }

})
document.getElementById('tr').addEventListener('click', function(event) {
  event.preventDefault();
  getMovies("https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=vote_average.desc&without_genres=99,10755&vote_count.gte=200&"+API_KEY);
});

document.getElementById('tvshows').addEventListener('click', function(event) {
  event.preventDefault();
  getTVShows("https://api.themoviedb.org/3/discover/tv?include_adult=false&include_null_first_air_dates=false&language=en-US&page=1&sort_by=popularity.desc"+'&'+API_KEY);
  
});

document.getElementById('trending').addEventListener('click', function(event) {
  event.preventDefault();
  getMovies("https://api.themoviedb.org/3/trending/all/day?language=en-US&"+API_KEY);
  
});

document.getElementById('wishlist').addEventListener('click', function(event) {
  event.preventDefault();
  getMovies("https://api.themoviedb.org/3/account/21783429/watchlist/tv?language=en-US&page=1&sort_by=created_at.asc&"+API_KEY);
});

