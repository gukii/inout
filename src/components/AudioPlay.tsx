import {  useRef, useEffect } from 'react';

// audio.play() is an async function, can t be interrupted by simple .pause()


  export function playAudioPromise( audioRef:any ) {

    const playPromise = audioRef?.current?.play()
  
    if (playPromise !== undefined) {
  
      playPromise.then( _ => {
        console.log('audio paused..')
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      })
      .catch(error => {
        console.log('audio play err:', error)
          // Auto-play was prevented
          // Show paused UI.
      });
    }
  }
  
  
  export function playAudioFix( audioRef:any, promRef:any ) {
  
  
    if (!audioRef.current.paused) {
      if (promRef.current !== undefined) {
  
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
  
  export function playAudioPromiseUnhandled( audioRef:any ) {
  
  
    if (!audioRef.current.paused) {
      audioRef.current?.pause();
      audioRef.current.currentTime = 0;
    }
    audioRef.current?.play()
  
  }
  
  export async function playAudioRepeat( audioRef:any, n=1, ms=300, promRef:any ) {
      console.log('should be playing sound..')
        for (let i=n; i>0; i--) {
            //playAudioPromiseUnhandled( audioRef )
            playAudioFix( audioRef, promRef )
  
            if (n > 0) await new Promise( (res) => setTimeout( res, ms ))
        }
  }
  


  // const [ playAudio, pauseAudio, stopAudio ] = useAudio( "./asdf.mp3" )

  export const useAudio = ( url:string ) => {

    //const a = useRef<HTMLMediaElement>() 
    const a = useRef<HTMLAudioElement>() 
    const promRef = useRef<any>() 
    

    useEffect( ()=> {

      if (!url) return

      console.log('url:', url)

      a.current = new Audio( url )
      a.current.load()

      //playAudio()

      //return () => a.current.pause()

    }, [url] )


    const pauseAudio = ( reset=false ) => {
      if (!a.current.paused) {
        if (promRef.current !== undefined) {

            promRef.current.then( _ => {
              console.log('audio paused after p..')
              a.current.pause();
              if (reset) a.current.currentTime = 0;
            })
            .catch(error => {
              console.log('audio play err:', error)
                // Auto-play was prevented
                // Show paused UI.
            });
        } else {
          console.log('audio paused without p..')
          a.current.pause();
          if (reset) a.current.currentTime = 0;
        }
      }
    }


    const stopAudio = () => {
      pauseAudio( true )
    }


    const playAudio = ()=> {

      stopAudio()
      promRef.current = a.current?.play()
    }


    return [ playAudio, pauseAudio, stopAudio ]

  }





  /*
    const playAudio = ()=> {
      if (!a.current) return
      promRef.current = a.current.play()
      if (promRef.current  !== undefined) {
        promRef.current 
          .then(_ => {
            // autoplay started
          })
          .catch(err => {
            // catch dom exception
            console.info(err)
          })
      }
    }
*/
