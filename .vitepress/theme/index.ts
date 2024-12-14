import  Theme from "vitepress/theme";
import {h} from 'vue'
import './style/var.css'
import HomeHero from "./components/HomeHero.vue";
export default{
    ...Theme,
    Layout: ()=>{
        // const Layout=Theme.Layout()
        // Layout.components.HomeHero= HomeHero
        // return Layout
        return h(Theme.Layout,null,{
            'home-hero-image': ()=>h(HomeHero)
        })
    }
}