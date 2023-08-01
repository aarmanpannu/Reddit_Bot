import puppeteer from 'puppeteer';

async function navigate (count) {
    // launches browser
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--enable-speech-dispatcher']
        // can control the display size and position here
            // slowMo: 250,
    });

    // create new tab
    const page = await browser.newPage();

    // goes to reddit
    await page.goto('https://www.reddit.com/');

    // removes notifications (can change to other permission structures)
    const context = browser.defaultBrowserContext();
    await context.overridePermissions('https://www.reddit.com/', ["notifications"]);

    const community = 'askReddit';
    await findCommunity(page,community, count);

    await findThread(page,community, count);

    // const data = await collectThreadData(page);

    return [browser, page]
    
}

async function findCommunity (page, community, count) {    
    // types out Headless Chrome but spaces character typing by 100 miliseconds
    // searches community name in search bar
    await page.type("[id='header-search-bar']", 
        community
        ,{delay: 50}
        );    
    
    setTimeout(() => { page.click("[data-testid='search-trigger-item']"); }, count);
    
    // clicks on communities tab
    await page.waitForSelector("[data-testid='tab_communities']", {visible: true});
    setTimeout(() => { page.click("[data-testid='tab_communities']"); }, count);

    // go to specific community
    // finds first one 
    console.log("finding community")
 
    await page.waitForSelector("[data-testid = 'subreddit-link'] h6", {visible: true});
    setTimeout(() => { page.click("[data-testid = 'subreddit-link'] h6"); }, count);
 
    await console.log("community found")
}

async function findThread (page, community) {    
    // click on first title it sees
    console.log("finding thread")
    await page.waitForSelector("[data-testid='post-container']", {visible: true});
    
    // document.querySelector("[data-testid='post-container']").querySelector("div a span").innerHTML
    let posts = await page.$$("[data-testid='post-container']");
    let i = 0
    let post = posts[i]
    page.waitForSelector("span", {visible: true})
    
    let isModpost = await page.evaluate((post) => {
        const mod = post.querySelector("div a span")
        return mod.innerText;
    },
        post
    )
    
    while (isModpost == 'Modpost')
        {
            i++;
            post = posts[i]
            page.waitForSelector("span", {visible: true})

            isModpost = await page.evaluate((post) => {
                const mod = post.querySelector("div a span")
                return mod.innerText;
            },
                post
            )
    }
    
    await post.click()
    console.log("thread found");
}


/*
async function collectThreadData(page) {
    const data = new Map();
    
    // find number of upvotes
    await page.waitForSelector("[aria-label = 'upvote'] + div", {visible: true});
    const upvotes = await page.$("[aria-label = 'upvote'] + div");
    let upvoteText = await page.evaluate(function (upvotes) {
        return upvotes.innerText;
    },
        upvotes
    );

    let upvote
    if (upvoteText.includes(".")) {
        upvoteText = upvoteText.replace(".","");
        upvoteText = upvoteText.replace("k","");
        upvote = upvoteText * 100;
        
    } else if (upvoteText.includes("k")) {
        upvoteText = upvoteText.replace("k","");
        upvote = upvoteText * 1000;
    } else {
        upvote = upvoteText;
    };

    data.set("Upvotes",upvote)
    
    // find text of the post:
    await page.waitForSelector("[data-testid = 'post-container'] h1", {visible: true});
    const title = await page.$("[data-testid = 'post-container'] h1");
    const titleText = await page.evaluate(function (title) {
        return title.innerText;
    },
        title
    );

    data.set('Title', titleText);
    console.log(data.get('Title'))

    // finding comments:
    const commentsArray = []
    await page.waitForSelector("[data-testid='comment']", {visible: true});
    const commentElements = await page.$$("[data-testid='comment']");

    for (const comEl of commentElements) {
        const commentText = await page.evaluate(function (comment) {
            return comment.innerText 
        },
            // input for this function is comEl for variable comment
            comEl
        )
        commentsArray.push(commentText); 
    }

    data.set('Comments', commentsArray)
    console.log(data.get('Comments'))

    return data
}
*/

// mainFunc(count);

export {navigate};