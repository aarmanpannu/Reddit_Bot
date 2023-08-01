
import {navigate} from "./navigate.js"
import {collect} from "./collect.js"
import {makeVideo} from "./video.js"


const browserInfo = await navigate(1000)
const browser = browserInfo[0]
const page = browserInfo[1]
setTimeout(() => {collect(browser, page, "testings")}, 2000);
// await makeVideo("bg.mp4", "testings")

    



