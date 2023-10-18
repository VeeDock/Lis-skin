async function findAndBuySkin() {
    const response = await fetch('https://lis-skins.ru/market/csgo/?sort_by=float_desc&float_from=0.999&ajax=1');
    const data = await response.json();

    const parser = new DOMParser();
    const skins = parser.parseFromString(data.skins, 'text/html');

    const foundSkins = skins.querySelectorAll('div.item.market_item.item_csgo');
    console.log('The found skins:', foundSkins);

    if (foundSkins.length > 0) {
        const dataId = foundSkins[0].getAttribute('data-id');
        const dataLink = foundSkins[0].getAttribute('data-link');

        const response = await fetch(`${dataLink}`);
        const data = await response.text();

        const doc = parser.parseFromString(data, 'text/html');
        const skin = doc.querySelectorAll(`[data-id="${dataId}"]`);
        const skinNameElement = doc.querySelector('.skin-name');
        const skinName = skinNameElement.textContent;
        console.log("Skin name:", skinName);
        if (skin) {
            const csrfTokenMetaTag = document.querySelector('meta[name="csrf-token"]');
            const csrfToken = csrfTokenMetaTag.getAttribute('content');

            const desiredCookieName1 = "_ga";
            const desiredCookieName2 = "_ym_uid";

            const yandexClientId = await getDesiredCookieValue(desiredCookieName2);
            const googleClientId = await getDesiredCookieValue(desiredCookieName1);

            const modifyGoogleClientId = googleClientId.split('.');
            const googleId = modifyGoogleClientId[2] + '.' + modifyGoogleClientId[3];
            await purchaseSkin(dataId, yandexClientId, googleId, csrfToken, skinName);
        }
    }
}

setInterval(findAndBuySkin, 60000);

async function getDesiredCookieValue(cookieName) {
    const cookies = document.cookie.split('; ');

    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.indexOf(cookieName + '=') === 0) {
            return cookie.substring(cookieName.length + 1);
        }
    }
    return null;
}

async function purchaseSkin(id, yandexClientId, googleClientId, csrfToken, name) {
    return fetch('https://lis-skins.ru/market/purchase/now', {
        method: 'POST',
        body: new URLSearchParams({
            google_client_id: `${googleClientId}`,
            yandex_client_id: `${yandexClientId}`,
            obtained_skin_id: `${id}`}),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            'X-Csrf-Token': `${csrfToken}`,
        },
    })
        .then(response => response.json())
        .then(async data => {
                if (data.html) {
                    const message = `The ${name} skin has been purchased.`;
                    await telegramNotification(message);
                } else {
                    const message = 'Top up your balance to buy new skin.';
                    await telegramNotification(message);
                }
            }
        )
        .catch(error => console.log(error));
}

async function telegramNotification(message) {
    const botToken = '6357941177:AAEeq5BC-2NVXWPjPGM-mSqPbng_EGr0WvE';
    const chatId = '98826820';

    fetch(`https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${message}`)
        .then(response => response.json())
        .then(data => console.log('Telegram notification was send', data))
        .catch(error => console.error(error));
}





