import puppeteer from 'puppeteer';
import {execSync, spawn } from "child_process";

async function collect(browser, page, threadName) {

    await page.reload()
    await page.setViewport({
        width: 375,
        height: 812,
    })
    await screenshotThread(page, threadName);
    setTimeout(() => {browser.close(); }, 5000);
}

async function screenshotThread(page, threadName) {
    
    const folder = `Threads/${threadName}`;
    const command = `mkdir -p ${folder}`;
    execSync(command);

    console.log("screenshot title")
    await page.waitForSelector("div [id~='-post-rtjson-content']", {visible: true});
    const title = await page.$("[slot='title']");
    const titleTxt = await title.evaluate((title)  => {
        return title.innerText;
    },
        title
    )
    console.log(titleTxt)  
    let titleLoc = folder + `/${threadName}`  + "Comment0.png";

    const comLoc = folder + `/${threadName}` + "Comment"

    await screenshot(page, title, titleLoc);

    // const titleTxt = await title.evaluate((title)  => {
    //     return title.innerText;
    // },
    //     title
    // )
      
    titleLoc = titleLoc.slice(0, titleLoc.length-4);
    await speech(titleTxt, titleLoc);

    await screenshotComments(page, comLoc);
}

async function screenshot(page, element, saveLocation) {
    console.log("screenshot")
    const cords = await page.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        const x = bounds["x"], y = bounds["y"], width = bounds["width"], height = bounds["height"]
        return {x, y, width, height};
    }, element);
    
    await page.screenshot({
        path : saveLocation,
        clip : {
            "x" : cords["x"],
            "y" : cords["y"],
            "height": cords["height"],
            "width": cords["width"] }
        });    
}


async function screenshotComments(page, saveLocation) {
    
    await page.waitForSelector("[id~='-post-rtjson-content']", {visible: true});
    let allCommentElements = await page.$$("[id~='-post-rtjson-content']");
    
    let i = 0;
    let commentElements = [];
    console.log("1")
    while (commentElements.length < 10) {
        console.log({i})
        console.log(commentElements)
        let comEl = allCommentElements[i];
        i++; 
        
        // const level = await comEl.evaluate((comEl) => {
        //     const level = comEl.querySelector("span").innerText;
        //     return level
        // },
        //     comEl
        // )

        // if (level.slice(-1) == 1 || level.slice(-1) == 2) {
            
            // const cords = await page.evaluate((element) => {
            //     console.log("screenshotComments")
            //     const bounds = element.getBoundingClientRect();
            //     const x = bounds["x"], y = bounds["y"], width = bounds["width"], height = bounds["height"]
            //     return {x, y, width, height};
            // }, comEl);
        const cords = await page.evaluate(el => {
            const {x, y, width, height} = el.getBoundingClientRect();
            return {x, y, width, height};
        }, comEl);
        console.log(cords["height"])

            // comments that are less than 1 line long 
            // (not shown because not expanded enough or 
            // other error) are not shown
            
        if (cords["height"] > 20) {
            commentElements.push(comEl);
        };
        // }
    }
    console.log("error1")
    i = 1
    for (const comEl of commentElements) {
        let comLoc = saveLocation + i;
        i++; 

        await screenshot(page, comEl, comLoc + ".png"); 
        
        const comTxt = await comEl.evaluate((comEl) => {
            let texts = comEl.querySelectorAll("p")
            let text = ""
            for (let i = 0; i < texts.length; i++) {
                text += texts[i].innerText;
            }

            return text
        },
            comEl
        );
        
        await speech(comTxt.replace(".", " . "),comLoc);
    }
}


/* async function speech(words, saveLocation) {
    // output is an .aiff file
    const command = `say "${words}" -o ${saveLocation}.aiff`;
    execSync(command)
}
*/

async function speech(words, saveLocation) {
    const childPython = spawn("python", ["TTS.py", words, `${saveLocation}.mp3`]);
}


export { collect }
