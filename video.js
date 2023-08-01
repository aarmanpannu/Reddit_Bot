import {execSync } from "child_process";
import {randomInt} from 'mathjs';


async function makeVideo(background, threadName) {
    // path to ffmpeg
    const declarePath = "export PATH=$PATH:/Users/aarmanpannu/Code/Projects/Reddit";
    execSync(declarePath);

    const copyBackgroundCMD = `cp ${background} background.mp4`
    execSync(copyBackgroundCMD)
    
    // merges audio, and overlays images and audio onto video
    await overlayThread("background.mp4", threadName)
    remove("background.mp4")
}

async function cropAndResize(file, audioDuration) {
    /* 
    resizes the VIDEO to the height of the input dimensions
    and then crops it to fit that dimension (get's rid of width)
    
    OUTPUT NAME: crop + filename
    Ex: title --> croptitle
    */

    // trims into propper duration
    let height =  "1848"
    

    let findLengthCMD = `ffprobe -i ${file} -show_entries format=duration -v quiet -of csv="p=0"`.replace("\n", ``).replace("\r", ``); 
    let videoDuration =  Math.round(parseFloat(execSync(findLengthCMD).toString()) * 10) / 10;
    let start = randomInt(0, videoDuration - parseFloat(audioDuration))

    let trimCMD = `ffmpeg -y -i ${file} -ss ${start} -t ${audioDuration} trim${file}`.replace("\n", ``).replace("\r", ``);
    
    console.log(trimCMD)
    execSync(trimCMD)
    await removeAndRename(file, `trim${file}`)

    // file name
    let tempOutputName = `scale${file}`

    // scale
    let scaleToCMD = `ffmpeg -y -i ${file} -vf scale=-2:${height} ${tempOutputName}`;
    console.log(scaleToCMD)
    execSync(scaleToCMD);
    
    await removeAndRename(file, tempOutputName)

    // crop
    let finalName = `crop${file}`;
    let findCurDimsCMD = `ffprobe -v error -select_streams v -show_entries stream=width,height -of csv=p=0:s=x ${file}`
    console.log(findCurDimsCMD)
    let curDims = execSync(findCurDimsCMD).toString().split("x");
    let xCoord = curDims[0]/2 - 947/2
    let cropCMD = `ffmpeg -y -i ${file} -filter:v "crop=w=946:h=1848:x=${xCoord}:y=0" ${finalName}`
    console.log(cropCMD)
    execSync(cropCMD);
    await removeAndRename(file, finalName)

    let changeAudioCMD = `ffmpeg -y -i ${file} -filter:a "volume=0.85" audio${file}`
    console.log(changeAudioCMD)
    execSync(changeAudioCMD)
    
    await removeAndRename(file, `audio${file}`)
}


async function overlayThread(background, threadName) {
    // makes list of files in folder
    let path = `Threads/${threadName}`
    let findFilesCMD = `ls ${path}`
    
    let filesList = execSync(findFilesCMD).toString().split("\n")
    filesList.pop()
    
    let start = 0 
    let count = 0
    let inputsIMG = ""
    let orderIMG = ""
    let inputsAUD = ""
    let orderAUD = ""
    let img = ""
    let audio = ""
    let v = "[0:v]"

    let moveFilesCMD = `mv /Users/aarmanpannu/Code/Projects/Reddit/threads/${threadName}/* /Users/aarmanpannu/Code/Projects/Reddit`
    execSync(moveFilesCMD)

    for (let i = 0; i < filesList.length; i+= 2) {
        // making audio CMDs
        audio = filesList[i]
        img = filesList[i+1]
        
        inputsAUD += `-i ${audio} `
        orderAUD += `[${count}:0]`

        // making img CMDs
        // reScaling IMG
        let tempOutputName = `scale${img}`
        let scaleToCMD = `ffmpeg -y -i ${img} -vf scale=846:-2 ${tempOutputName}`;
        execSync(scaleToCMD);
        await removeAndRename(img, tempOutputName)

        // finding right placement
        let findCurDimsCMD = `ffprobe -v error -select_streams v -show_entries stream=width,height -of csv=p=0:s=x ${img}`.replace("\n", ``).replace("\r", ``);
        let curDims = execSync(findCurDimsCMD).toString().split("x");
        let yCoord = 924 - curDims[1]/2

        inputsIMG += `-i ${img} `

        let findLengthCMD = `ffprobe -i ${audio} -show_entries format=duration -v quiet -of csv="p=0"`.replace("\n", ``).replace("\r", ``); 
        let duration = Math.round(parseFloat(execSync(findLengthCMD).toString()) * 10) / 10;
        
        
        if (i == filesList.length - 2) {
            orderIMG += `${v}[${i/2 +1}:v]overlay=50:${yCoord}:enable='between(t, ${start}, ${start + duration})'`
        } else {
            orderIMG += `${v}[${i/2 +1}:v]overlay=50:${yCoord}:enable='between(t, ${start}, ${start + duration})'[v${i/2}]; `
        }
        
        v = `[v${i/2}]`
        start += duration;
        count += 1;

    }

    // overlay all images on video and create one merged audio file
    
    // audio into one file 
    let concatCMD = `ffmpeg -y ${inputsAUD} -filter_complex '${orderAUD}concat=n=${count}:v=0:a=1[out]' -map '[out]' FinalAudio.aiff`
    execSync(concatCMD)

    let findLengthCMD = `ffprobe -i FinalAudio.aiff -show_entries format=duration -v quiet -of csv="p=0"`.replace("\n", ``).replace("\r", ``);
    let audioDuration = execSync(findLengthCMD).toString()
    
    // crop and resize video
    await cropAndResize(background, audioDuration)

    // overlay all images 
    let overlayCMD = `ffmpeg -i ${background} ${inputsIMG} -filter_complex "${orderIMG}" -c:v libx264 -preset ultrafast -qp 20  -c:a copy -y woAudio.mp4`
    console.log(overlayCMD)
    execSync(overlayCMD)

    // Overlay audio
    let overlayAudioCMD = `ffmpeg -y -i woAudio.mp4 -i FinalAudio.aiff -filter_complex "[1:a] adelay=0|0[voice];  
    [0:a][voice] amix=inputs=2:duration=longest [audio_out]" -map 0:v -map "[audio_out]" ${threadName}.mp4`;
    execSync(overlayAudioCMD);
    
    // removal of images, audio files, and intermittent versions
    remove("woAudio.mp4")
    remove("FinalAudio.aiff")
    for (let i = 0; i < filesList.length; i++) {
        remove(filesList[i])
    }

    let moveCMD = `mv /Users/aarmanpannu/Code/Projects/Reddit/${threadName}.mp4 /Users/aarmanpannu/Code/Projects/Reddit/FinalVideos`
    execSync(moveCMD)


    // remove old test folder
    let removeDir = `rm -r /Users/aarmanpannu/Code/Projects/Reddit/Threads/${threadName}`
    execSync(removeDir)
}

async function removeAndRename(input, output) {
    // this is supposed to be done after a new command that creates a new file
    // deletes the old file's name and renames the new file to the old one's name
    // remove INPUT and rename OUTPUT

    // remove part
    await remove(input)

    // rename to input's name
    let renameCMD = `mv ${output} ${input}`
    execSync(renameCMD)
}

async function remove(file) {
    let removeCMD = `rm ${file}`
    execSync(removeCMD);
}

// not fully sure if i need this
/* async function overlayAudioImg(video, audio, image, startTime) {

    let findLengthCMD = `ffprobe -i ${audio} -show_entries format=duration -v quiet -of csv="p=0"`; 
    let duration = execSync(findLengthCMD).toString();
    
    
    overlayAudio(video, audio, startTime);
    overlayImg(video, image, startTime, parseFloat(startTime) + parseFloat(duration));

}

async function overlayAudio(video, audio, startTime){
    
    let fileName = `overlayAudio${video}`

    let overlayAudioCMD = `ffmpeg -y -i ${video} -i ${audio}  -filter_complex "[1:a] adelay=${startTime*1000}|${startTime*1000} [voice];  
    [0:a][voice] amix=inputs=2:duration=longest [audio_out]"  -map 0:v -map "[audio_out]" -y ${fileName}`;

    execSync(overlayAudioCMD);
    removeAndRename(video, fileName)
}

async function overlayImg(video, img, startTime, endTime){
    
    let tempOutputName = `scale${img}`

    let scaleToCMD = `ffmpeg -y -i ${img} -vf scale=845:-2 ${tempOutputName}`;
    execSync(scaleToCMD);
    removeAndRename(img, tempOutputName)

    let findCurDimsCMD = `ffprobe -v error -select_streams v -show_entries stream=width,height -of csv=p=0:s=x ${img}`
    let curDims = execSync(findCurDimsCMD).toString().split("x");
    
    let yCoord = 924 + curDims[1]/2

    let vidOutput = "plsWork.mp4"
    let overlayCMD = `ffmpeg -y -i ${video} -i ${img} -filter_complex "[0:v][1:v] overlay=50:${yCoord}:enable='between(t,${startTime},${endTime})'" -c:a copy ${vidOutput}`;
    execSync(overlayCMD); 
    removeAndRename(video, vidOutput)
    remove(img)
} */

export {makeVideo};