import React from 'react';
import ReactDOM from 'react-dom'
import { Empty } from 'antd';
import 'antd/dist/antd.less';
import '../css/stash.less';

class App extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        let mainWindowId = null;
        chrome.runtime.sendMessage({
            getMainWindowId: true
        }, response => {
            mainWindowId = response;
        })
        chrome.windows.onRemoved.addListener(windowId => {
            if (windowId === mainWindowId) {
                // main window closed
                chrome.windows.getCurrent(self => {
                    // close self
                    chrome.windows.remove(self.id);
                });
            }
        });
    }

    render() {
        return (
            <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<span>This window contains all the hidden tabs. Please do not close it.</span>}
            />
        )
    }
}

ReactDOM.render(<App/>, document.getElementById('root'));
