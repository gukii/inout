import { ReactElement, useState, Suspense, useRef, useEffect, useMemo, useCallback } from 'react';
import QrScanner from 'qr-scanner'; // if installed via package and bundling with a module bundler like webpack or rollup
import { playAudioRepeat } from './AudioPlay'


// using a dong2.mp3 stored in "public" folder to beep on new QR code

// useage example:
// https://github.com/nimiq/qr-scanner/blob/master/demo/index.html


// audio.play() is an async function, can t be interrupted by simple .pause()


const getTimeStr = (ts:number) => new Date(ts).toLocaleString("en-GB", { timeStyle: "medium", hour12: false})  //timeZoneName: "short" 

interface ListMap {
    [key: string]: { 
      checkIn?: { 
        ts: Number, 
        timeStr: String
      }, 
      checkOut?: { 
        ts: Number, 
        timeStr: String
      }
    }
}

// svg arrow to the right
// <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>


const RenderAlert = (msg:string) : ReactElement => {
/*
  const [ show, setShow ] = useState( true )

  useEffect( ()=> {
    const id=setTimeout( ()=> setShow(false), 1000 )

    return () => clearTimeout(id)
  }, [msg] )


  if ( !show ) return <span></span>
*/
return(
  <div className="-mt-50 z-50 bg-amber-300 backdrop-blur-xl z-20 rounded-lg p-1 shadow">
      <div className="flex">
          <div className="truncate text-slate-800  text-sm inline-flex space-x-1 items-center">
            <svg height="1.5em" width="1.5em" aria-hidden="true" focusable="false" data-prefix="far" data-icon="arrow-alt-circle-right" className="w-7 h-7" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
              <path fill="currentColor" d="M504 256C504 119 393 8 256 8S8 119 8 256s111 248 248 248 248-111 248-248zm-448 0c0-110.5 89.5-200 200-200s200 89.5 200 200-89.5 200-200 200S56 366.5 56 256zm72 20v-40c0-6.6 5.4-12 12-12h116v-67c0-10.7 12.9-16 20.5-8.5l99 99c4.7 4.7 4.7 12.3 0 17l-99 99c-7.6 7.6-20.5 2.2-20.5-8.5v-67H140c-6.6 0-12-5.4-12-12z"></path>
            </svg>                
            <span style={limitedText}>{msg?? "waiting for QR.."}</span>
          </div>
      </div>
  </div>
)
}


function QrScan() {

  // ref for QR scanner instance
  const scannerRef = useRef<QrScanner>()

  const videoContainerRef = useRef() // not really used yet
  const videoRef = useRef<HTMLVideoElement>() // for QR code window
  //const audioRef = useRef<HTMLAudioElement>() // for beep effect // old
  const audioInRef = useRef<HTMLAudioElement>() // for beep IN effect
  const audioOutRef = useRef<HTMLAudioElement>() // for beep OUT effect

  const promRef = useRef<any>() // for beep effect, hacking async play promise 

  const [started, setStarted] = useState(false)

  const prevQrRef = useRef<string>("")
  const [qrRes, setQrRes] = useState<QrScanner.ScanResult | undefined>()

  // <(String, { checkIn: { ts: Number, timeStr: Sring}, checkOut: { ts: Number, timeStr: Sring}}[]) | undefined>
  const listRef = useRef<Map<string,any>>(new Map())

  //const list = new Map();
  const [listHtml, setListHtml] = useState<any | undefined>()
  


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

      // checkout user 
      listRef.current.set( data, { ...rec, checkOut: { ts, timeStr } })

      //window.alert('already scanned: '+data)
      //playAudioRepeat( audioRef, 2, 300, promRef )
      playAudioRepeat( audioOutRef, 1, 300, promRef )
      setListHtml( RenderList() )

      return
    } 

    playAudioRepeat( audioInRef, 1, 300, promRef )


    listRef.current.set( data, { checkIn: { ts, timeStr } })
    setListHtml( RenderList() )

  }, [qrRes])



  const renderLine = ( data?:string, item?:any ) => {
    return (
      <li key={item?.checkIn?.timeStr} 
        className="text-sm font-medium text-gray-900 px-1 py-2 text-left"
        style={ limitedText }
      >
          { item.checkIn &&  <span style={{ color:"green"}}>
            {item.checkIn.timeStr}
          </span> }
          { item.checkOut &&  <span style={{ color:"red", marginLeft:".3em"}}>
            {item.checkOut.timeStr}
          </span> } 
          <span style={{ marginLeft:".5em"}}>: {data}</span>
      </li>)
  }


  const RenderList = useCallback( () => {
    if (!listRef.current) return null
    
    let s = []  

    for (const [key, value] of listRef.current) { 
      //console.log('renderlist k, v:', key, value)

      // unshift, so that the latest list additions show on top
      s.unshift( renderLine( key, value ) ) 
    }

    return s
  }, [listRef.current] )
  


  // <video ref={videoRef} id="qr-video" width="50%" height="50%" />

  return (
    <>        
        <div ref={videoContainerRef} id="video-container" style={{ opacity: started ? 1 : 0 }} >
            <video ref={videoRef} id="qr-video" />
            { qrRes && RenderAlert(qrRes.data)}

        </div>


        <div style={{ height:".3em"}} />


        <button 
          className={`rounded-xl ${started ? 'bg-red-300': 'bg-green-300'} shadow-lg`}
          onClick={()=> {
            if (started) {
              if (!scannerRef.current) console.log('error, no scanner instance to stop..')
              scannerRef.current?.stop()
            } else {
              if (!scannerRef.current) console.log('error, no scanner instance to start..')
              scannerRef.current?.start()              
            }
            setStarted(  p => !p )
          }}>
            {started ? 'Stop' : 'Scan QR code'}
        </button>

        <div style={{ height:".3em"}} />



        <audio ref={audioInRef} >
          <source 
            src="/maleHi.mp3" 
            type="audio/mpeg"/>
        </audio>

        <audio ref={audioOutRef} >
          <source 
            src="/maleThanks.mp3" 
            type="audio/mpeg"/>
        </audio>

        <hr />

        <div className="flex flex-col">
          <div className="overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 inline-block min-w-full sm:px-6 lg:px-8">
              <div className="overflow-hidden">

                <ol className="min-w-full">
                  { listHtml }
                </ol>
                
              </div>
            </div>
          </div>
        </div>

        <hr />

    </>
  );
}


export default QrScan;



const limitedText = {
  whiteSpace: "nowrap",
  width: "90vw", /*"30ch",*/
  overflow: "hidden",
  textOverflow: "ellipsis",
  marginLeft:".3em"
} as const

/*
<style>
  .limited-text{
    white-space: nowrap;
    width: 400px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
*/


// https://soundbible.com/1815-A-Tone.html
// simple public, mp3 sound useEffect. 

/*

        <button 
          className="p-2 rounded-xl bg-red-300 shadow-lg" 
          onClick={()=> {
            if (!scannerRef.current) console.log('error, no scanner instance to stop..')
            scannerRef.current.$canvas.style.display = showOutlineRef.current ? 'block' : 'none'
            showOutlineRef.current = !showOutlineRef.current
          }}>
            show Outline: {showOutlineRef.current ? 'on' : 'off'}

            showOutline
        </button>



        <button 
          className="p-2 rounded-xl bg-red-300 shadow-lg" 
          onClick={()=> {
            if (!showOutline) console.log('error, no scanner instance to stop..')
            scannerRef.current.$canvas.style.display = showOutline ? 'block' : 'none'
            scannerRef.current?.stop()
            setStarted(false)
            setShowOutline(  p => !p )
            //scannerRef.current?.start()
          }}>
            show QR Outline: {showOutline ? 'on' : 'off'} 
        </button>





        <b>Detected QR code: </b>

        <span id="cam-qr-qrRes">{qrRes?.data}</span>
        <br/>


        <b>Last detected at: </b>

        <span id="cam-qr-qrRes-timestamp">{qrRes?.ts}</span>
        <br/>

        <span id="cam-qr-qrRes-timestring">{qrRes?.timeStr}</span>
        <br/>
        */
