const TAB_PLAYER =0;
const TAB_QUEUE  =1;
const TAB_SEARCH =2;
const SEARCHED=0;
const RELATED=1;
const YoutubeKey="AIzaSyCCgdgCh4cw1pnscxtRsfP80M23lMlCdKY";

const vm =new Vue({
  el: "#app",
  data:{
    tabQueue:{
        mvList:[//movieQueue
          { Id:"etKuJ7ibrvc",
            description:"お口の恋人ロッテのスペシャルアニメーション 「ベイビーアイラブユーだぜ」のフルバージョンを公開！ 企画・プロデュース:川村元気 監督:松...",
            thumbnail:"https://i.ytimg.com/vi/etKuJ7ibrvc/default.jpg",
            title:"ロッテ×BUMP OF CHICKEN ベイビーアイラブユーだぜ フルバージョン",
            uniqueKey:"1544599827709#0",
        }],
        mvListCt:0,//movieQueueCt
        move:{
            able:false,//movable
            from:'',//moveFrom
        }
    },
    tabPlay:{
        mvList:[],
        nextPageToken:'',
    },
    tabSearch:{
        mvList:[],// movieSearchList
        nextPageToken:'',//nextPageToken:
        word:'',// searchWord
        wordLS:'',// searchWordLS
    },
    tabCommon:{
        ListClickUniqueKey:'',//ListClickUniqueKey
        selectedTab : 0, // selectedTab
    },
  },/*
  mounted(){
  },*/
  methods:{
    
    addMovieQueue:function(msg,movie){
        switch(msg){
            case "PLAY_NOW":        
                vm.tabQueue.mvList.splice(vm.tabQueue.mvListCt+1,0,movie);
                playNextMovie()
                break;
            case "PLAY_NEXT":
                vm.tabQueue.mvList.splice(vm.tabQueue.mvListCt+1,0,movie);
                break;
            case "PLAY_LAST":
                vm.tabQueue.mvList.push(movie);
                break;

        }
    },
    changeMovieQueue(msg,item){
        const itemCt=vm.tabQueue.mvList.findIndex(({uniqueKey})=>uniqueKey===item.uniqueKey);
        /*↑uniqueキーが一致するtabQueue.mvListの配列番号 つまりitemが存在するtabQueue.mvList配列内の位置 */
        switch(msg){
            case "JUMP"://itemの位置に再生キューを移動して再生
                vm.tabQueue.mvListCt= itemCt-1;
                playNextMovie()
                break;
            case 'DELETE'://itemを再生キューから削除
                if(vm.tabQueue.mvListCt==itemCt)//現在再生中なら次を再生してから
                    playNextMovie();
                    vm.tabQueue.mvList.splice(itemCt,1);//削除
                break;
            
            case 'MOVE'://itemの位置を移動して再生キュー内の順番を変更
                if(vm.tabQueue.mvListCt==itemCt){
                    iziToast.error({ 
                        title: 'This movie is playing now', 
                        message: 'can not move movie in the list.' 
                      });
                    return 0;
                }
                
                vm.tabQueue.move.from=item;
                //削除前に、移動する動画のデータを保存しておく
                vm.tabQueue.mvList.splice(itemCt,1);//削除
                if(vm.tabQueue.mvListCt>itemCt)//削除に合わせてtabQueue.mvListCtも現在再生しているものを指すように適切に変更
                    vm.tabQueue.mvListCt--;
                vm.tabQueue.move.able=true;
                /*選択画面を挟んでから移動先が決定 */
                break;

        }
    },
    moveHere(item){
        let itemCt;
        if(item===0){
            itemCt=-1;//一番上に挿入する場合
        }else{
            itemCt= vm.tabQueue.mvList.findIndex(({uniqueKey})=>uniqueKey===item.uniqueKey);
        }
        vm.tabQueue.mvList.splice(itemCt+1,0,vm.tabQueue.move.from);//予め保存していたデータをリストに挿入
        if(vm.tabQueue.mvListCt>itemCt)
            vm.tabQueue.mvListCt++;//挿入後はvm.tabQueue.mvListCtも適切に変更する必要がある
        vm.tabQueue.move.from="";
        vm.tabQueue.move.able=false;
    },

    searchWordSubmitted:function(){
      if(this.tabSearch.word=="")
        return 0;
      const requestUrl 
        ='https://www.googleapis.com/youtube/v3/search?'
        + "q=" + this.tabSearch.word
        +'&key='+YoutubeKey
        +'&part=snippet&order=relevance&regionCode=jp&type=video&videoEmbeddable=true';
      const date = new Date();

      axios.get(requestUrl)
        .then(function (res) {
          vm.movieSearchList =[];
          res.data.items.forEach((item,index) => {
            const searchMovie ={
                uniqueKey:  `${date.getTime()}#${index}`,
                Id: item.id.videoId,
                title: item.snippet.title,
                description: item.snippet.description,
                thumbnail: item.snippet.thumbnails.default.url
              };
  //            console.log(searchMovie);
              vm.movieSearchList.push(searchMovie);
          });
          vm.tabSearch.nextPageToken=res.data.nextPageToken;
          vm.tabSearch.wordLS = vm.tabSearch.word;
        
        }).catch(function (err) {
          console.log(err);
          iziToast.error({ 
            title: 'Reject http request', 
            message: 'could not get movie details. Youtube reject http request.' 
          });
        });
    },

    searchWordSubmittedMore:function(){
        if(this.tabSearch.wordLS=="")
            return 0;
          const requestUrl 
          ='https://www.googleapis.com/youtube/v3/search?'
          + "q=" + this.tabSearch.wordLS
          +'&key='+YoutubeKey
          +'&part=snippet&order=relevance&regionCode=jp&type=video&videoEmbeddable=true'
          +'&pageToken='+ this.tabSearch.nextPageToken;
        const date = new Date();
  
        axios.get(requestUrl)
          .then(function (res) {
            res.data.items.forEach((item,index) => {
              const searchMovie ={
                  uniqueKey:  `${date.getTime()}#${index}`,
                  Id: item.id.videoId,
                  title: item.snippet.title,
                  description: item.snippet.description,
                  thumbnail: item.snippet.thumbnails.default.url
                };
                vm.movieSearchList.push(searchMovie);
            });
            vm.tabSearch.nextPageToken=res.data.nextPageToken;
          }).catch(function (err) {
            console.log(err);
            iziToast.error({ 
              title: 'Reject http request', 
              message: 'could not get movie details. Youtube reject http request.' 
            });
        });
    },

    listMovieClicked:function(movie){
        if(vm.tabCommon.ListClickUniqueKey==movie.uniqueKey){
            vm.tabCommon.ListClickUniqueKey = "";
        }else{
            vm.tabCommon.ListClickUniqueKey=movie.uniqueKey;
        }
    },
    tabChange(num){
        vm.tabCommon.ListClickUniqueKey = "";
        vm.tabCommon.selectedTab=num;
    }
  }
});

let tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
let firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
let player;

function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    videoId: vm.tabQueue.mvList[0].Id,
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange,
      'onError':onPlayerError
    }
  });
}

function onPlayerReady(event) {
    event.target.playVideo();
}

function onPlayerStateChange(event) {
  if(event.data == YT.PlayerState.ENDED)
    playNextMovie();
}

function onPlayerError(event){
  switch(event.data){
    case 2://リクエストが無効なパラメータ値 動画IDのフォーマットが異なる
    case 5://HTML5プレイヤーに関するエラー
    case 100://動画が見つからない(非公開含む)
    case 101://埋め込み不可の動画
    case 150://埋め込み不可の動画
      playNextMovie();
      iziToast.error({ 
        title: 'Skip Movie', 
        message: 'The skipped movie is not permitted on Youtube embedded player.'
      });
      break;

    default:
      iziToast.error({ title: 'Unknown Error', message: 'Stop movie' });
  }
}

function playNextMovie(){ //tabQueue.mvListが全て再生したら最初からループ
  vm.tabQueue.mvListCt = (vm.tabQueue.mvListCt+1) % vm.tabQueue.mvList.length;
//  if(vm.tabQueue.mvList.length > vm.tabQueue.mvListCt +1 );
    player.loadVideoById({
      videoId: vm.tabQueue.mvList[ vm.tabQueue.mvListCt ].Id,
      suggestedQuality:'small'
    });
//関連動画リストの取得

    //relatedToVideoId
}