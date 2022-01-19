import * as React from "react";
import RecordRTC, { StereoAudioRecorder, MediaStreamRecorder } from "recordrtc";

const Transcribe = () => {
  const [transcript, setTranscript] = React.useState("");
  const [isTranscribing, setIsTranscribing] = React.useState(false);
  //let isRecording = false;
  let socket;
  let recorder;

  const startTranscribing = async () => {
    const response = await fetch("http://localhost:5001/");
    const data = await response.json();
    console.log("DATOKEN", data);
    if (data.error) {
      alert(data.error);
    }

    const { token } = data;

    // establish wss with AssemblyAI (AAI) at 16000 sample rate
    socket = await new WebSocket(
      `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${token}`
    );

    // handle incoming messages to display transcription to the DOM
    const texts = {};
    socket.onmessage = (message) => {
      console.log("Entering onmessage");
      console.log("onsocket message is: ", message);
      let msg = "";
      const res = JSON.parse(message.data);
      texts[res.audio_start] = res.text;
      const keys = Object.keys(texts);
      keys.sort((a, b) => a - b);
      for (const key of keys) {
        if (texts[key]) {
          msg += ` ${texts[key]}`;
        }
      }
      console.log("Leaving onmessage. msg is: ", msg);
      setTranscript(msg);
      console.log("Opening. Socket is: ", socket);
    };

    socket.onerror = (event) => {
      console.error(event);
      socket.close();
      setIsTranscribing(false);
    };

    socket.onclose = (event) => {
      console.log(event);
      socket = null;
      setIsTranscribing(false);
    };

    socket.onopen = () => {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          recorder = new RecordRTC(stream, {
            type: "audio",
            mimeType: "audio/webm;codecs=pcm", // endpoint requires 16bit PCM audio
            recorderType: StereoAudioRecorder,
            timeSlice: 250, // set 250 ms intervals of data that sends to AAI
            desiredSampRate: 16000,
            numberOfAudioChannels: 1, // real-time requires only one channel
            bufferSize: 4096,
            audioBitsPerSecond: 128000,
            ondataavailable: (blob) => {
              const reader = new FileReader();
              reader.onload = () => {
                const base64data = reader.result;

                // audio data must be sent as a base64 encoded string
                if (socket) {
                  socket.send(
                    JSON.stringify({
                      audio_data: base64data.split("base64,")[1],
                    })
                  );
                }
              };
              reader.readAsDataURL(blob);
            },
          });

          recorder.startRecording();
          setIsTranscribing(true);
        })
        .catch((err) => console.error(err));
    };
  };

  const stopTranscribing = async () => {
    console.log("Stopping socket...");
    console.log("Closing. Socket is: ", socket); // why is this undefined????
    if (socket) {
      socket.onclose = (event) => {
        console.log(event);
        socket = null;
      };
      //socket.close();
    }
    setIsTranscribing(false);
  };

  return (
    <div
      style={{
        flexDirection: "row",
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {isTranscribing ? (
        <button onClick={stopTranscribing}>Stop Transcribing</button>
      ) : (
        <button onClick={startTranscribing}>Start Transcribing</button>
      )}
    </div>
  );
};

export default Transcribe;
