import alt from '../../../../alt'
import PlayerStore from '../../store';
import PlayerActions from '../../actions';
import subUtil from '../../utils/subtitles';
import ls from 'local-storage';
import _ from 'lodash';

class SubtitleActions {

    constructor() {
        this.generateActions(
            'setSubDelay',
            'settingChange'
        );
    }


    time(time) {
        // print subtitle text if a subtitle is selected
        var subtitleState = this.alt.stores.SubtitleStore.state;
        if (subtitleState.subtitle.length > 0)
            subUtil.findLine(subtitleState.subtitle, subtitleState.trackSub, subtitleState.delay, time).then(result => {
                if (result && result.text != subtitleState.text)
                    this.actions.settingChange(result);
            });

    }

    findSubs(itemDesc) {

        var player = PlayerStore.getState();

        var subQuery = {
            filepath: itemDesc.path,
            fps: player.wcjs.input.fps
        };

        if (itemDesc.byteSize)
            subQuery.byteLength = itemDesc.byteSize;

        if (itemDesc.torrentHash) {
            subQuery.torrentHash = itemDesc.torrentHash;
            subQuery.isFinished = false;
        }

        subQuery.cb = subs => {

            if (!subs) {
                if (!ls.isSet('playerNotifs') || ls('playerNotifs'))
                    player.notifier.info('Subtitles Not Found', '', 6000);
            } else {
                PlayerActions.settingChange({
                    foundSubs: true
                });
                PlayerActions.setDesc({
                    subtitles: subs
                });
                if (!ls.isSet('playerNotifs') || ls('playerNotifs'))
                    player.notifier.info('Found Subtitles', '', 6000);

                if (!ls.isSet('autoSub') || ls('autoSub')) {
                    if (ls('lastLanguage') && ls('lastLanguage') != 'none') {
                        if (subs[ls('lastLanguage')]) {
                            this.actions.loadSub(subs[ls('lastLanguage')]);
                            // select it in the menu too
                            if (player.wcjs.subtitles.count > 0)
                                var itemIdx = player.wcjs.subtitles.count;
                            else
                                var itemIdx = 1;

                            _.some(subs, (el, ij) => {
                                itemIdx++;
                                if (ij == ls('lastLanguage')) {
                                    this.actions.settingChange({
                                        selectedSub: itemIdx
                                    });
                                    return true;
                                } else {
                                    return false;
                                }
                            })
                        }
                    }
                }
            }
        }

        subUtil.fetchSubs(subQuery);

    }

    loadSub(subLink) {
        subUtil.loadSubtitle(subLink, parsedSub => {
            if (!parsedSub) {
                PlayerActions.announcement('Subtitle Loading Failed');
            } else {
                this.actions.settingChange({
                    subtitle: parsedSub,
                    delay: 0,
                    trackSub: -1
                });
                var playerState = PlayerStore.getState();
                playerState.subDelayField.refs['input'].defaultValue = '0 ms';
                playerState.wcjs.subtitles.delay = 0;
            }
        });
    }

}


export
default alt.createActions(SubtitleActions);
