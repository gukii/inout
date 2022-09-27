import { useState, Suspense, useRef, useEffect, useMemo, useCallback } from 'react';
import QrScanner from 'qr-scanner'; // if installed via package and bundling with a module bundler like webpack or rollup

import { useAudio } from './AudioPlay'

const inSound = require("../tmpAudio/femaleIn.mp3")
const outSound = require("../tmpAudio/femaleOut.mp3")



//import inSound from '/public/maleHi.mp3'
//import outSound from '../../public/maleBye.mp3'

//import inSound2 from '../tmpAudio/femaleIn.mp3'
//import outSound2 from '../tmpAudio/femaleOut.mp3'

// using a dong2.mp3 stored in "public" folder to beep on new QR code

// useage example (uses flash, camera selection, ... vanilla JS):
// https://github.com/nimiq/qr-scanner/blob/master/demo/index.html


// audio.play() is an async function, can t be interrupted by simple .pause()


// export function playAudioPromise( audioRef:any ) {
// 
//   const playPromise = audioRef?.current?.play()
// 
//   if (playPromise != undefined) {
// 
//     playPromise.then( _ => {
//       console.log('audio paused..')
//       audioRef.current.pause();
//       audioRef.current.currentTime = 0;
//     })
//     .catch(error => {
//       console.log('audio play err:', error)
//         // Auto-play was prevented
//         // Show paused UI.
//     });
//   }
// }

// export function playAudioPromiseUnhandled( audioRef:any ) {
// 
// 
//   if (!audioRef.current.paused) {
//     audioRef.current?.pause();
//     audioRef.current.currentTime = 0;
//   }
//   audioRef.current?.play()
// 
// }

/*

export function playAudioFix( audioRef:any, promRef:any ) {


  if (!audioRef.current.paused) {
    if (promRef.current != undefined) {

		promRef.current.then( _ => {
		  console.log('audio paused after p..')
		  audioRef.current.pause();
		  audioRef.current.currentTime = 0;
		})
		.catch(error => {
		  console.log('audio play err:', error)
		    // Auto-play was prevented
		    // Show paused UI.
		});
	} else {
	  console.log('audio paused without p..')
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
     }

  }
  promRef.current = audioRef.current?.play()

}



export async function playAudioRepeat( audioRef:any, n=1, ms=300, promRef:any ) {
      for (let i=n; i>0; i--) {
          //playAudioPromiseUnhandled( audioRef )
          playAudioFix( audioRef, promRef )

          if (n > 0) await new Promise( (res) => setTimeout( res, ms ))
      }
}

*/


// const [ playAudio, pauseAudio, stopAudio ] = useAudio( "./asdf.mp3" )
const limitedText = {
    whiteSpace: "nowrap",
    width: "20chr",
    overflow: "hidden",
    textOverflow: "ellipsis"
} as const





// using a dong2.mp3 stored in "public" folder to beep on new QR code

// useage example (uses flash, camera selection, ... vanilla JS):
// https://github.com/nimiq/qr-scanner/blob/master/demo/index.html


// audio.play() is an async function, can t be interrupted by simple .pause()


// export function playAudioPromise( audioRef:any ) {
// 
//   const playPromise = audioRef?.current?.play()
// 
//   if (playPromise != undefined) {
// 
//     playPromise.then( _ => {
//       console.log('audio paused..')
//       audioRef.current.pause();
//       audioRef.current.currentTime = 0;
//     })
//     .catch(error => {
//       console.log('audio play err:', error)
//         // Auto-play was prevented
//         // Show paused UI.
//     });
//   }
// }

// export function playAudioPromiseUnhandled( audioRef:any ) {
// 
// 
//   if (!audioRef.current.paused) {
//     audioRef.current?.pause();
//     audioRef.current.currentTime = 0;
//   }
//   audioRef.current?.play()
// 
// }

/*

export function playAudioFix( audioRef:any, promRef:any ) {


  if (!audioRef.current.paused) {
    if (promRef.current != undefined) {

		promRef.current.then( _ => {
		  console.log('audio paused after p..')
		  audioRef.current.pause();
		  audioRef.current.currentTime = 0;
		})
		.catch(error => {
		  console.log('audio play err:', error)
		    // Auto-play was prevented
		    // Show paused UI.
		});
	} else {
	  console.log('audio paused without p..')
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
     }

  }
  promRef.current = audioRef.current?.play()

}



export async function playAudioRepeat( audioRef:any, n=1, ms=300, promRef:any ) {
      for (let i=n; i>0; i--) {
          //playAudioPromiseUnhandled( audioRef )
          playAudioFix( audioRef, promRef )

          if (n > 0) await new Promise( (res) => setTimeout( res, ms ))
      }
}

*/
const getTimeStr = (ts:number) => new Date(ts).toLocaleString("en-GB", { timeStyle: "medium", hour12: false})  //timeZoneName: "short" 

interface ListMap {
    [key: string]: { 
      checkIn?: { 
        ts: number, 
        timeStr: string
      }, 
      checkOut?: { 
        ts: number, 
        timeStr: string
      }
    },
}


// one for checkIn
// one for checkOut
interface timeMap {
  [key: string]: { 
    time?: { 
      ts: Number, 
      timeStr: String
    }
  }
}



function QrScan() {



  const [ playIn ] = useAudio( inSound )
  const [ playOut ] = useAudio( outSound )

  //const [ playIn ] = useAudio( "/maleHi.mp3" )
  //const [ playOut ] = useAudio( "/maleThanks.mp3" )

  //const [ playIn ] = useAudio( window.location.href+"/maleHi.mp3" )
  //const [ playOut ] = useAudio( window.location.href+"/maleThanks.mp3" )

  

  // ref for QR scanner instance
  const scannerRef = useRef<QrScanner>()

  const videoContainerRef = useRef() // not really used yet
  const videoRef = useRef<HTMLVideoElement>() // for QR code window

  const audioRef = useRef<HTMLAudioElement>() // for beep effect // old
  const audioInRef = useRef<HTMLAudioElement>() // for beep IN effect
  const audioOutRef = useRef<HTMLAudioElement>() // for beep OUT effect

  const promRef = useRef<any>() // for beep effect, hacking async play promise 

  const [started, setStarted] = useState(0)

  const prevQrRef = useRef<string>("")
  const [qrRes, setQrRes] = useState<QrScanner.ScanResult | undefined>()

  // <(String, { checkIn: { ts: Number, timeStr: Sring}, checkOut: { ts: Number, timeStr: Sring}}[]) | undefined>
  const listRef = useRef<Map<string,any>>(new Map())
  // https://www.w3schools.com/js/js_maps.asp

  //const list = new Map();
  const [listHtml, setListHtml] = useState<any | undefined>()

  const [outCount, setOutCount] = useState(0)


  useEffect( ()=> {

    
    scannerRef.current = new QrScanner(
      videoRef.current,
      result => {
        //console.log('qr cb:', result.data)

        if ( result?.data && result?.data !== prevQrRef.current ) {
          prevQrRef.current = result.data
          setQrRes( result )
        }
      },
      {
        //onDecodeError: error => console.log('error:', JSON.stringify(error)),

        highlightScanRegion: true,
        highlightCodeOutline: true, //showOutline of QR square,
      }
    );

    // cleanup on unmount
    return ()=> {
      scannerRef.current.stop()
      //if (!!audioRef.current) audioRef.current?.pause();  // in case a sound is still playing
    }

  }, [] )



  useEffect( ()=> {

    if (!qrRes) return

    const ts = Date.now()
    const timeStr = getTimeStr( ts )
    const {data} = qrRes

    console.log('new QR:', data)
    //playAudioRepeat( audioRef, 1, 300, promRef )


    const rec = listRef.current.get(data)

    // checked in, but not checked out => check out the user
    if ( rec?.checkIn?.ts && !rec?.checkOut?.ts ) {

      if ( started === 1 ) {
        // user was already checked in. giving double "Hi" to let him know..
        //playAudioRepeat( audioInRef, 2, 300, promRef )
        playIn() // playAlreadyIn()
        return
      }

      // checkout user 
      listRef.current.set( data, { ...rec, checkOut: { ts, timeStr } })
      setOutCount( o => ++o )

      //window.alert('already scanned: '+data)
      //playAudioRepeat( audioRef, 2, 300, promRef )
      //playAudioRepeat( audioOutRef, 1, 300, promRef )
      playOut()
      setListHtml( RenderList() )

      return

    } else if ( rec?.checkIn?.ts && rec?.checkOut?.ts && started === 2  ) {

      // checked out already, playing double "bye" to let him know...
      //playAudioRepeat( audioOutRef, 2, 300, promRef )
      playOut()
      return

    } else if (rec?.checkIn?.ts && rec?.checkOut?.ts ) {

      // user checked in and checked out already, giving trible "bye"
      //playAudioRepeat( audioOutRef, 3, 300, promRef )
      playOut()
      return      
    }


    //playAudioRepeat( audioInRef, 1, 300, promRef )
    playIn()


    listRef.current.set( data, { checkIn: { ts, timeStr } })
    setListHtml( RenderList() )

  }, [qrRes])



  const renderLine = ( data?:string, item?:any ) => {
    return (
      <li key={item?.checkIn?.timeStr} 
        style={limitedText}
      >
          { item.checkIn &&  <span style={{ color:"green"}}>
            {item.checkIn.timeStr}
          </span> }
          { item.checkOut &&  <span style={{ color:"red"}}>
            : {item.checkOut.timeStr}
          </span> } 
          <span> : {data}</span>
      </li>)
  }


  const RenderList = useCallback( () => {
    if (!listRef.current) return null
    
    let s = []  

    for (const [key, value] of listRef.current) { 
      console.log('renderlist k, v:', key, value)
      // if (value.checkOut?.ts) _out++
      s.unshift(renderLine( key, value ))
    }

    return s
  }, [listRef.current] )
  


  // style={{ position: "relative", zIndex:1 }}

  // video is positioned absolutely. 
  // zIndex does not work on absolute element

  /*
        <div ref={videoContainerRef} id="video-container" style={{ maxHeight:"70vh" }} >
            <video ref={videoRef} id="qr-video" style={{ zIndex: -1 }} />
        </div>

        <ol style={{ marginTop: "-2em", minHeight:"2em", zIndex:50, position:"relative" }}>
              { listHtml }
        </ol>




        <div style={{ display: started ? "block" : "none", fontWeight: 900, color:"white", marginTop: "-1.3em", minHeight:"1.3em", zIndex:50, position:"relative" }}>
          in:{ listRef.current.size } / out:{ outCount }
        </div>
  */
  

        //         <div ref={videoContainerRef} id="video-container" style={{ maxHeight: started ?  "90vh" : "3em", opacity: started ? 1 : 0 }} >
//         <div ref={videoContainerRef} id="video-container" className={`${ started ? "max-h-[90vh] opacity-100" : "opacity-0 max-h-12"}`}  >


  return (
    <div>        

        <div ref={videoContainerRef} id="video-container" style={{ 
          maxHeight: started ?  "90vh" : "3em", 
          opacity: started ? 1 : 0 
        }} >
            <video ref={videoRef} id="qr-video" style={{ zIndex: -1 }} />
        </div>


        <div className={`ml-0 flex justify-around ${!started ?? "hidden" } -mt-8 min-h-[2em] font-bold text-slate-50 shadow-md z-30 relative w-screen`}>
          
          <div className="h-6 ">
            in:{ listRef.current.size } 
          </div>
          <div className="h-8 ">
              <button 
                className={`z-50 p-2 rounded-xl text-black ${started === 1 ? 'bg-red-100': 'bg-green-300'} ${started === 2 ? 'opacity-25': 'bg-green-100'} shadow-lg`}
                disabled={started === 2}
                onClick={()=> {
                  if (started) {
                    if (!scannerRef.current) console.log('error, no scanner instance to stop..')
                    scannerRef.current?.stop()
                  } else {
                    if (!scannerRef.current) console.log('error, no scanner instance to start..')
                    scannerRef.current?.start()              
                  }
                  setStarted( p => !p ? 1 : 0 )
                }}>
                  {started === 1 ? 'Stop' : 'CheckIn'}
              </button>   


              <button 
                className={`z-50 p-2 rounded-xl text-black ${started === 2 ? 'bg-red-100': 'bg-red-300'} ${started === 1 ? 'opacity-25': 'bg-green-100'} shadow-lg`}
                disabled={started === 1}
                onClick={()=> {
                  if (started) {
                    if (!scannerRef.current) console.log('error, no scanner instance to stop..')
                    scannerRef.current?.stop()
                  } else {
                    if (!scannerRef.current) console.log('error, no scanner instance to start..')
                    scannerRef.current?.start()              
                  }
                  setStarted( p => !p ? 2 : 0  )
                  
                }}>
                  
                  {started === 2 ? 'Stop' : 'CheckOut'}
              </button>
          </div>
          <div className="h-6 ">
            out:{ outCount }
          </div>

        </div>



        <ol style={{ zIndex:50, position:"relative", marginTop:".8em" }}>
              { listHtml }
        </ol>




        <hr />

    </div>
  );
}


export default QrScan;








