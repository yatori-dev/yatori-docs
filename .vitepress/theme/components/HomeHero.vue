<template>
    <div class="home-hero-image">
      <img src="/img/logo.png" alt="Hero Image">
      <div class="bg"></div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'HomeHero'
  }
  </script>
  
  <style>
  .home-hero-image .bg{
    background: linear-gradient(45deg, rgb(255, 0, 0), rgba(0, 106, 254, 0.7), rgb(0 172 193 / 70%), rgb(122, 32, 171),rgb(255 255 255),rgb(255, 152, 42));
    background-size: 400%;
    animation: tcc 10s ease infinite;
}
.home-hero-image img{
  /* 平滑过渡效果 */
  box-shadow:black 0px 0px 10px;
  border-radius: 50%;
  transition: transform 0.5s ease-in-out,filter 0.5s ease-in-out; 
}
.home-hero-image img:hover {
  transform: rotate3d(1, 1, 1, 360deg) scale(0.90);
  filter: drop-shadow(0px 0px 100px rgb(210, 210, 210));
  border-radius: 50%; 
}
@keyframes tcc {
    0% {
        background-position: 0% 0%
    }
    20% {
        background-position: 0% 50%
    }
    40% {
        background-position: 50% 100%
    }
    60% {
        background-position: 100% 50%
    }
    80% {
        background-position: 50% 0%
    }
    100% {
        background-position: 0% 0%
    }
}
@media screen and (min-width: 0px) and (max-width: 640px) {
    .home-hero-image {
    height: 200px;
    width: 200px;
    text-align: center;
    margin: auto auto; /*居中*/
    padding-top: 50px;
    position: static;
  }
  .home-hero-image img {
    width: 100%;
    max-width: 200px;
    position:absolute;
  }
  .home-hero-image .bg{
    position: absolute;
    height: 200px;
    width: 200px;
    filter: blur(150px);
    z-index: -1;
  }
}

@media screen and (min-width: 640px) and (max-width: 960px) {
    .home-hero-image {
    height: 250px;
    width: 250px;
    text-align: center;
    margin: auto auto; /*居中*/
    padding-top: 50px;
    position: static;
  }
  .home-hero-image img {
    width: 100%;
    max-width: 250px;
    position:absolute;
  }
  .home-hero-image .bg{
    position: absolute;
    height: 250px;
    width: 250px;
    filter: blur(150px);
    z-index: -1;
  }
}

@media screen and (min-width: 960px) {
    .home-hero-image {
    height: 350px;
    width: 350px;
    text-align: center;
    margin: auto auto; /*居中*/
    position: static;
  }
  .home-hero-image img {
    width: 100%;
    max-width: 350px;
    position:absolute;
  }
  .home-hero-image .bg{
    position: absolute;
    height: 350px;
    width: 350px;
    filter: blur(150px);
    z-index: -1;
  }
}
  </style>
  