$(document).ready(function () {
    fetch('https://drops.warframestat.us/data/relics.json')
        .then(response => response.json())
        .then(data => {
            fetchItemInfo(data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
});

function fetchItemInfo(relicData) {
    fetch('https://cors-proxy.fringe.zone/api.warframe.market/v2/items')
        .then(response => response.json())
        .then(data => {
            fetchItemPrice(data, relicData);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function fetchItemPrice(itemsInfo, relicData) {
    fetch('https://cors-proxy.fringe.zone/api.warframe.market/v1/tools/ducats')
        .then(response => response.json())
        .then(itemPrice => {
            itemsInfo = itemsInfo["data"];
            itemPrice = itemPrice["payload"]["previous_day"];

            let mergedList = _.map(itemPrice, function(item){
                return _.extend(item, _.findWhere(itemsInfo, { id: item.item }));});

            initializeRelicData(relicData, mergedList);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function initializeRelicData(relicData, priceData) {
    const relics = relicData["relics"];
    const groupedRelics = [];
    relics.forEach(relic => {

        for (const reward of relic.rewards) {
            let price = priceData.find(a => a["i18n"]["en"].name === reward["itemName"])
            if (price !== undefined) {
                reward["price"] = price["median"];
            }
            else {
                reward["price"] = 0;
            }
        }

        // Find if there's already an existing group for this tier and relicName
        let existingGroup = groupedRelics.find(group =>
            group.tier === relic.tier && group.relicName === relic.relicName);

        // If a group exists, add this relic's drop to the existing drops array
        if (existingGroup) {
            existingGroup.drops.push({
                states: [relic.state],
                rewards: [relic.rewards]
            });
        } else {
            // If no group exists, create a new group with the drop
            groupedRelics.push({
                tier: relic.tier,
                relicName: relic.relicName,
                drops: [{
                    states: [relic.state],
                    rewards: [relic.rewards]
                }]
            });
        }
    });

    console.log(groupedRelics);
    groupedRelics.forEach(group => {
        createRelicGroupHTML(group);
    });

}


function createRelicGroupHTML(relic) {
    let relicData = getRelicData(relic);

    const groupContainer = $('<div>').addClass('group-container').data('refinement', 0);
    const rewardContainer = $('<div>').addClass('reward-container');
    const header = $('<img>').attr({
        src: relicData.image,  // Set the image source
        alt: "relic.png",
        class: 'relic-icon'
    }).addClass('relic-icon');
    const title = $('<h3>').text(`${relic.tier} - ${relic.relicName}`).addClass('group-header');

    header.on('click', function () {
        let refinementValue = groupContainer.data('refinement');

        if (refinementValue < 3) {
            refinementValue++;
        } else {
            refinementValue = 0;
        }

        groupContainer.data('refinement', refinementValue);

        let relicData = getRelicData(relic, refinementValue);
        setRewards(rewardContainer, relicData.rewards);

        header.attr({src: relicData.image});
    });

    groupContainer.append(header);
    groupContainer.append(title);

    setRewards(rewardContainer, relicData.rewards);

    groupContainer.append(rewardContainer);
    $('#data-container').append(groupContainer);
}

async function setRewards(rewardContainer, rewards) {
    rewardContainer.empty();

    const platContainer = $('<div>').addClass('plat-container');
    let averagePrice = 0;
    const platValue = $('<p>');
    platContainer.append(platValue);
    platContainer.append($('<img>').attr({
        src: "https://wiki.warframe.com/images/thumb/PlatinumLarge.png/300px-PlatinumLarge.png",
        alt: "plat.png",
        class: 'plat-icon'
    }).addClass('plat-icon'));
    rewardContainer.append(platContainer);

    for (const reward of rewards) {
        rewardContainer.append($('<p>').text(`${reward["chance"]}% ${reward["itemName"]}`));

        const price = reward.price;
        averagePrice += price * reward["chance"] / 100;
    }

    platValue.text(Math.round(averagePrice * 100) / 100);
}

function getRelicData(relic, refinementIndex = 0) {
    let resultData = {};

    let refinement;
    switch (refinementIndex) {
        case 0:
            refinement = "Intact";
            break;

        case 1:
            refinement = "Exceptional";
            break;

        case 2:
            refinement = "Flawless";
            break;

        case 3:
            refinement = "Radiant";
            break;
    }

    resultData.image = `https://wiki.warframe.com/images/thumb/${relic.tier}Relic${refinement}.png/300px-${relic.tier}Relic${refinement}.png`;
    let rewards = relic.drops.find(element => element.states[0] === refinement)["rewards"][0];
    resultData.rewards = rewards.sort((a, b) => b.chance - a.chance);

    return resultData;
}