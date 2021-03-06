export default {
    mode: 'spa',
    head: {
        title: 'Play Queue',
        meta: [
            {charset:"utf-8"},
            {name:"description", content:"youtubeを連続再生するweb app"},
            {name:"author", content:"dalchemic"},
            {name:"viewport", content:"width=device-width, initial-scale=1"},
            {name:"mobile-web-app-capable", content:"yes"}
        ],
        link: [
            {rel:"shortcut icon", href:"favicon.ico"},
            {rel:"icon", sizes:"196x196", href:"favicon.ico"},
            {rel:"apple-touch-icon", sizes:"152x152", href:"favicon.ico"},
            
            {href:"https://fonts.googleapis.com/icon?family=Material+Icons", rel:"stylesheet"},
            {href:"https://fonts.googleapis.com/css?family=Anton", rel:"stylesheet"}
        ]
    },
    plugins: [
        "@/plugins/vue-youtube",
        "@/plugins/vue-izitoast"
    ],
    css: [
        '@/plugins/materialize.min.css'
    ]
}
