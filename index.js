const TAB_PLAYER = 0;
const TAB_QUEUE = 1;
const TAB_SEARCH = 2;
const SEARCHED = 0;
const RELATED = 1;
const YoutubeKey = "AIzaSyAXVeNZpwqKoLvjbUaGj2Gug8IsZCm95vo";
let player;
//localStorage.clear();
if(!(('localStorage' in window) && (window.localStorage !== null))) {
    // ローカルストレージが使えない。。。
    iziToast.error({
        title: 'Local Storage Error',
        message: '保存機能が使えません。ブラウザがHTML5 Local Storageに対応していません。'
    });
}

function storeLS(listName,mvList){
    localStorage.setItem(listName, JSON.stringify(mvList));
}
function showLS(){//keyの配列
    return Object.keys(localStorage);
}
function getLS(listName){
    return JSON.parse(localStorage.getItem(listName));
}
function deleteLS(listName){
    localStorage.removeItem(listName);
}

const vm = new Vue({
    el: "#app",
    data: {
        tabQueue: {
            mvList: [//movieQueue
                {
                    Id: "",
                    description210: "",
                    thumbnail: "",
                    title: "",
                    uniqueKey: "",
                    publishedAt:"",
                    description: '',
                    duration: '',
                    viewCount: '',
                    channelTitle: '',
                } ],
            mvListCt: 0,//movieQueueCt
            move: {
                able: false,//movable
                from: -1,//moveFrom
            },
            LSkey:{
                list:[],
                inputKey:'',
                listNameConflict:false,
                listWindow:false,
                inputWindow:false,
            },
        },
        tabPlay: {
            mvList: [],
            nextPageToken: '',
            preWord: 'relatedToVideoId=',
            wordSubmit: '',// 
            fullDescription: false,
            
        },
        tabSearch: {
            mvList: [],// movieSearchList
            nextPageToken: '',//nextPageToken:
            preWord: 'q=',
            word: '',// searchWord
            wordSubmit: '',
        },
        tabCommon: {
            ListClickUniqueKey: '',//ListClickUniqueKey
            selectedTab: 0,// selectedTab
            playerFinish :true,//playerStop
            playerStart:false,
        },
        tQloop:false,
        tQautoPlayRelatedMovie:false,
        tQautoPlayNewRelatedMovie:false,
    },
    watch: {
        tQloop: function(newVal, oldVal) {
                if( newVal==true
                    &&oldVal==false
                    &&this.tabCommon.playerStart==true ){
                        playRestart();
                    }
        },
        tQautoPlayRelatedMovie: function(newVal, oldVal) {

                if( newVal==true
                    &&oldVal==false
                    &&this.tabCommon.playerStart==true ){
                        playRestart();
                    }
        }
    },
/*mounted(){
  },*/
    methods: {
        addMovieQueue: function (msg, movie) {

            const date = new Date();
            let pushedMv =Object.assign({}, movie);
            pushedMv.uniqueKey=`${date.getTime()}#added`;
            switch (msg) {
                case "PLAY_NOW":
                    this.tabQueue.mvList.splice(this.tabQueue.mvListCt + 1, 0, pushedMv);
                    playNextMovie();
                    break;
                case "PLAY_NEXT":
                    this.tabQueue.mvList.splice(this.tabQueue.mvListCt + 1, 0, pushedMv);
                    playRestart();//もし最後尾に再生するものが増えていたら再生してくれる。
                    break;
                case "PLAY_LAST":
                    this.tabQueue.mvList.push(pushedMv);
                    playRestart();//もし最後尾に再生するものが増えていたら再生してくれる。
                    break;

            }
        },
        changeMovieQueue(msg, item) {
            const itemCt = this.tabQueue.mvList.findIndex(({ uniqueKey }) => uniqueKey === item.uniqueKey);
            /*↑uniqueキーが一致するtabQueue.mvListの配列番号 つまりitemが存在するtabQueue.mvList配列内の位置 */
            switch (msg) {
                case "JUMP"://itemの位置に再生キューを移動して再生
                    this.tabQueue.mvListCt = itemCt - 1;
                    playNextMovie();
                    break;
                case 'DELETE'://itemを再生キューから削除
                    this.tabQueue.mvList.splice(itemCt, 1);//削除
                    if (this.tabQueue.mvListCt > itemCt)//削除に合わせてtabQueue.mvListCtも現在再生しているものを指すように適切に変更
                        this.tabQueue.mvListCt--;
                    break;

                case 'MOVE'://itemの位置を移動して再生キュー内の順番を変更
                    if(this.tabQueue.move.able == true)
                        this.moveCancel();
                    this.tabQueue.move.from = itemCt;
                    //削除前に、移動する動画の場所を保存しておく
                    this.tabQueue.move.able = true;
                    /*選択画面を挟んでから移動先が決定 */
                    break;
            }
        },
        moveHere(item) {
            const itemFrom=this.tabQueue.mvList[this.tabQueue.move.from];
            if(itemFrom==item){//同じ場所に変更しろと言われたらキャンセル
                this.moveCancel();
                return 0;
            }
            this.tabQueue.mvList.splice(this.tabQueue.move.from, 1);//削除
            if (this.tabQueue.mvListCt > this.tabQueue.move.from)//削除に合わせてtabQueue.mvListCtも現在再生しているものを指すように適切に変更
                this.tabQueue.mvListCt--;

            let itemCt;
            if (item === 0) {
                itemCt = -1;//一番上に挿入する場合
            } else {
                itemCt = this.tabQueue.mvList.findIndex(({ uniqueKey }) => uniqueKey === item.uniqueKey);
            }
            this.tabQueue.mvList.splice(itemCt + 1, 0, itemFrom);//予め保存していたデータをリストに挿入
            if (this.tabQueue.mvListCt > itemCt)
                this.tabQueue.mvListCt++;//挿入後はthis.tabQueue.mvListCtも適切に変更する必要がある
            this.tabQueue.move.from = -1;
            this.tabQueue.move.able = false;

            playRestart();//もし最後尾に再生するものが増えていたら再生してくれる。
        },
        moveCancel(){
            this.tabQueue.move.able = false;
            this.tabQueue.move.from = -1;
        },
        searchWordSubmitted() {
            if (this.tabSearch.word == "")
                return 0;
            
            let active_element = document.activeElement;// フォーカスを外す
            if(active_element){
                  active_element.blur();
                }
            getMovieList(this.tabSearch,true,this.tabSearch.word);
        },
        searchWordSubmittedMore() {
            if (this.tabSearch.wordSubmit == ""){
                if(this.tabSearch.word!=""){//もし未検索でmoreボタンを押して検索バーに文字があったら、その内容で検索
                    this.searchWordSubmitted();   
                }
                return 0;
                //ちなみに何も入力せずにmoreボタンを押していたら無視
            }

            getMovieList(this.tabSearch,false);
        },
        listMovieClicked(movie) {
            if (this.tabCommon.ListClickUniqueKey == movie.uniqueKey) {
                this.tabCommon.ListClickUniqueKey = "";
            } else {
                this.tabCommon.ListClickUniqueKey = movie.uniqueKey;
            }
        },
        tabChange(num) {
            this.tabCommon.ListClickUniqueKey = "";
            this.tabCommon.selectedTab = num;
            this.moveCancel();
        },
        relatedMovieMore(callback){//[callback..リスト追加後に行われる関数 任意]
            if(this.tabCommon.playerStart==false)
                return;
            getMovieList(this.tabPlay,false,undefined,callback);
        },
        addListStorage(LSkey){
            if(showLS().indexOf(LSkey)>=0){
                this.tabQueue.LSkey.listNameConflict=true;
                //既に存在する リスト名
                return;
            }else if(LSkey===""){
                return;
            }else{
                storeLS(LSkey,this.tabQueue.mvList);
                this.openListStorageWindow('CLOSE');  
            }

        },
        openListStorage(LSkey){
            if(LSkey==''){
                return;
            }
            this.openListStorageWindow('CLOSE');
            if(this.tabCommon.playerStart==true){            
                this.tabQueue.mvList.splice(0,this.tabQueue.mvListCt);
                this.tabQueue.mvList.splice(1);
                this.tabQueue.mvListCt=0;
                this.moveCancel();
                this.tabQueue.mvList=[...this.tabQueue.mvList, ...getLS(LSkey)];
                playNextMovie();
                this.tabQueue.mvList.splice(0,1);
                this.tabQueue.mvListCt=0;
            }else{
                this.tabQueue.mvList=[];
                this.tabQueue.mvList=getLS(LSkey);
                playNextMovie();
            }
        },
        deleteListStorage(LSkey){
            if(LSkey==''){
                return;
            }
            if(window.confirm(`${LSkey} を削除します。よろしいですか？`)){
                deleteLS(LSkey);
                this.tabQueue.LSkey.list=showLS();  
                this.openListStorageWindow('CLOSE');
            }
        },
        openListStorageWindow(window){//selectLS
            //playerStart==falseに非対応
            switch(window){
                case 'INPUT':
                    this.tabQueue.LSkey.inputKey="";
                    this.tabQueue.LSkey.listNameConflict=false;
                    this.tabQueue.LSkey.inputWindow = true;
                    this.tabQueue.LSkey.listWindow = false;
                    break;
                case 'LIST' :
                    this.tabQueue.LSkey.inputKey="";
                    this.tabQueue.LSkey.inputWindow = false;
                    this.tabQueue.LSkey.listWindow = true;
                    this.tabQueue.LSkey.list=showLS();
                    break;
                case 'CLOSE':
                    this.tabQueue.LSkey.inputWindow = false;
                    this.tabQueue.LSkey.listWindow = false;
                    break;
            }
        }
    }
});

function replacePlayer(){
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        videoId: vm.tabQueue.mvList[0].Id,
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }/*,
        playerVars: {
            "rel": 0,
            "autoplay": 0,
            "wmode": "opaque",
            'origin': location.protocol + '//' + location.hostname + "/"
        }*/
    });
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.ENDED)
        playNextMovie();
}

function onPlayerError(event) {
    switch (event.data) {
        case 100://動画が見つからない(非公開含む)
            playNextMovie();
            iziToast.error({
                title: 'Skip Movie',
                message: '動画が見つかりません。削除や非公開化によるものです。'
            });
            break;    
        case 101://埋め込み不可の動画
        case 150://埋め込み不可の動画
            playNextMovie();
            iziToast.error({
                title: 'Skip Movie',
                message: '埋め込み不可の動画です。'
            });
            break;
        case 2://リクエストが無効なパラメータ値 動画IDのフォーマットが異なる
            playNextMovie();
            iziToast.error({
                title: 'Skip Movie',
                message: 'Youtubeへの再生リクエストに無効なパラメータが設定されました。動画IDのフォーマットが異なる可能性があります。'
            });
            break;
        case 5://HTML5プレイヤーに関するエラー
            playNextMovie();
            iziToast.error({
                title: 'Skip Movie',
                message: 'HTML5プレイヤーに関するエラーが発生しました。'
            });
            break;
        
        default:
            iziToast.error({ title: 'Unknown Error', message: 'Stop movie' });
    }
}

function onPlayerReady(event) {
    getMovieInformation(vm.tabQueue.mvList[vm.tabQueue.mvListCt]);
    getMovieList(vm.tabPlay,true,vm.tabQueue.mvList[vm.tabQueue.mvListCt].Id);
    event.target.playVideo();
}

function playNextMovie() {
    //ページロード後最初の再生時にプレイヤーはプレイヤーを読み込む。
    if(vm.tabCommon.playerStart==false){
        //vm.tabQueue.mvListに初めて動画が追加されたとき
        //divをiframe置き換えてプレイヤー設置
        //(準備が整ったらイベントトリガーでonPlayerReady()が実行される。)
        //つまり初回にこの関数が呼ばれたときは、再生処理はこの関数ではなくonPlayerReady()で行われる
        vm.tabQueue.mvList.shift();
        vm.tabQueue.mvListCt=0;
        replacePlayer();
        vm.tabCommon.playerStart=true;
        vm.tabCommon.playerFinish=false;
        return;
    }

    //vm.tabQueue.mvListCtの更新
    if(vm.tQloop==true){//ループ
        vm.tabQueue.mvListCt = (vm.tabQueue.mvListCt + 1) % vm.tabQueue.mvList.length;
    }else{
        if(vm.tabQueue.mvListCt + 1 >=vm.tabQueue.mvList.length){//リストの末尾に到達
            if(vm.tQautoPlayRelatedMovie==true){//末尾動画の関連動画再生がOn
                let playMovie;
                if(vm.tQautoPlayNewRelatedMovie==true){//関連動画を未再生のものに限定
                    for(let i=0,iMax=vm.tabPlay.mvList.length; i<iMax ;i++){
                        const isExistMv= vm.tabQueue.mvList.find((mv)=>{
                            return mv.Id==vm.tabPlay.mvList[i].Id
                        });
                        if(isExistMv==undefined){
                            playMovie =vm.tabPlay.mvList[i];
                            break;          
                        }
                    } //関連動画リストがすべて再生済みならリストの続きをロード後、コールバックでもう一度playNextMovie
                    if(playMovie==undefined){
                        vm.relatedMovieMore(playNextMovie);
                        return;
                    }
                }else{
                    playMovie=vm.tabPlay.mvList[0];
                }
                vm.addMovieQueue("PLAY_NOW", playMovie);
            }else{//ループせず関連動画も再生しない
                vm.tabCommon.playerFinish=true;
            }
            return 0;
        }
        vm.tabQueue.mvListCt = vm.tabQueue.mvListCt + 1;
    }

    getMovieInformation(vm.tabQueue.mvList[vm.tabQueue.mvListCt]);
    vm.tabPlay.fullDescription=false;

    //再生しようとした動画が移動操作中の場合キャンセル
    if( vm.tabQueue.move.able==true 
        &&vm.tabQueue.move.from==vm.tabQueue.mvListCt){
            vm.moveCancel();
    }

    //関連動画リストの取得
    getMovieList(vm.tabPlay,true,vm.tabQueue.mvList[vm.tabQueue.mvListCt].Id);

    player.loadVideoById({
        videoId: vm.tabQueue.mvList[vm.tabQueue.mvListCt].Id,
        suggestedQuality: 'small'
    });
}

function getMovieList(tab,listReset,newWordSubmit,callback) {
    /*引数
    tab..tabQueue,tabPlay,tabSearch
    listReset..true/false 
    [newWordSubmit..検索パラメータ 任意
    [callback..リスト更新後に行いたい関数 任意]

    tab.preWord+tab.wordSubmit (とnextPageTokenがあればこれも)をGETでyoutubeに送信
    tab.mvListに動画をpush
    tab.nextPageTokenを更新
    */

    //初期化処理
    if(listReset==true){
        tab.mvList=[];
        tab.nextPageToken='';
    }
    if(newWordSubmit != undefined){
        tab.wordSubmit=newWordSubmit;
    }

    const requestUrl
        = 'https://www.googleapis.com/youtube/v3/search?'
        + tab.preWord + tab.wordSubmit
        + (tab.nextPageToken == '' ? '' : '&pageToken=' + tab.nextPageToken)
        + '&key=' + YoutubeKey
        + '&part=snippet&order=relevance&regionCode=jp&type=video&videoEmbeddable=true';
    const date = new Date();
    axios.get(requestUrl)
        .then((res)=> {
            res.data.items.forEach((item, index) => {
                const dt=new Date(item.snippet.publishedAt);
                let dsc=item.snippet.description;
                if(dsc.length>210) //説明が長すぎる場合は210文字でカットして...を付ける
                    dsc=dsc.substring(0,210)+'...';
                const searchMovie = {
                    uniqueKey: `${date.getTime()}#${index}`,
                    Id: item.id.videoId,
                    title: item.snippet.title,
                    description210: dsc,
                    thumbnail: item.snippet.thumbnails.default.url,
                    publishedAt: dt.toLocaleString(),
                    description: '',//以下は検索リクエストからは取得できない値。再生時に動画毎に取得している
                    duration: '',
                    viewCount: '',
                    channelTitle: ''
                };
                tab.mvList.push(searchMovie);
            });
            tab.nextPageToken = res.data.nextPageToken;
            if(callback!=undefined && typeof callback =='function')
                setTimeout(callback, 100);
        }).catch(function (err) {
            console.log(err);
            iziToast.error({
                title: 'Reject http request',
                message: 'Youtubeとの通信に失敗し、動画の検索結果を取得することができませんでした。'
            });
        });
}

function getMovieInformation(mv){
    const requestUrl
        = 'https://www.googleapis.com/youtube/v3/videos?'
        +  'id=' +mv.Id
        + '&key=' + YoutubeKey
        + '&part=snippet,contentDetails,statistics&regionCode=jp';
//    const date = new Date();
    axios.get(requestUrl)
        .then(function (res) {
//            mv.uniqueKey=`${date.getTime()}#added`;
            mv.description = res.data.items[0].snippet.description;
            mv.duration = res.data.items[0].contentDetails.duration.replace('PT','').replace('H','hour').replace('M','min').replace('S','sec');
            mv.viewCount = res.data.items[0].statistics.viewCount;
            mv.channelTitle = res.data.items[0].snippet.channelTitle;
        }).catch(function (err) {
            console.log(err);
            iziToast.error({
                title: 'Reject http request',
                message: 'Youtubeとの通信に失敗し、動画の詳細を取得することができませんでした。'
            });
        });
}

function playRestart(){
    if(vm.tabCommon.playerFinish==true){
        vm.tabCommon.playerFinish=false;
        playNextMovie();
    }
}