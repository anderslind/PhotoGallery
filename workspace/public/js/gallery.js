var thumbLoadingBlock = false;

var Gallery = React.createClass({
    getInitialState: function() {
        return {
            image: '',
            initialPath: '',
            path: '',
            result: {
                subfolders: [],
                files: []
            }
        };
    },
    componentDidMount: function() {
        this.state.initialPath = this.props.endpoint;
        this.load(this.state.initialPath);
        window.onscroll = function() {
            console.log(window.pageYOffset + ':' + window.outerHeight);
        };
    },    
    load: function(path, continuationToken) {
        var data = {};
        if (continuationToken) {
            data = ({
                'continuationToken': continuationToken
            });
        }

        $.ajax({
            url: path,
            dataType: 'json',
            cache: false,
            data: data,
            success: function(data) {
                if (continuationToken) {
                    var tempData = this.state.result;
                    Array.prototype.push.apply(tempData.subfolders, data.subfolders);
                    Array.prototype.push.apply(tempData.files, data.files);
                    tempData.continuationToken = data.continuationToken;
                    this.setState({
                        path: path,
                        result: tempData
                    });
                }
                else {
                    this.setState({
                        path: path,
                        result: data
                    });
                }
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(path, status, err.toString());
            }.bind(this)
        });
    },    
    handleOpenViewer: function(image) {
        image.path = this.state.path;
        this.setState({image: image});
    },
    switchImage: function(imageName) {
        var index = this.state.result.files.findIndex(function(file){
            return file === imageName;
        });
        this.handleOpenViewer({name: this.state.result.files[index], previous: this.state.result.files[index-1], next: this.state.result.files[index+1]  });
    },
    closeViewer: function() {
        this.setState({image: ''});
    },
    stepBack: function(path) {
        if (!path) {
            var presentPath = this.state.path;
            this.load(presentPath.slice(0, presentPath.lastIndexOf('%2F')))
        } else {
            var buildFullPath = this.state.path.slice(0, this.state.path.indexOf(path)) + path;
            this.load(buildFullPath);
        }
    },
    showMore: function() {
        this.load(this.state.path, this.state.result.continuationToken);
    },
    stopThumbLoad: function(){
        thumbLoadingBlock = true;
        console.log(thumbLoadingBlock);
    },
    render: function() {
        return (
            <div className="gallery">
                <a href='#' onClick={this.stopThumbLoad}>STOP</a>
                <Viewer image={this.state.image} onSwitch={this.switchImage} onClose={this.closeViewer}/>
                <Explorer showBacker={!this.state.initialPath || this.state.initialPath+'/' == 'api/'+this.state.result.folder ? true : false} path={this.state.path} onOpenViewer={this.handleOpenViewer} reload={this.load} stepBack={this.stepBack} showMore={this.showMore} result={this.state.result}/>
            </div>
        );
    }
});

var Explorer = React.createClass({
    componentWillReceiveProps: function(nextProps) {
       // window.scroll(0,0);
    },
    resetThumbLoadBlock: function() {
        thumbLoadingBlock = false;
    },
    stepInto: function(path) {
        this.resetThumbLoadBlock();
        this.props.reload(this.props.path + '%2F' +path);
    },
    jumpTo: function(path) {
        this.resetThumbLoadBlock();
        this.props.stepBack(path);
    },
    stepBack: function() {
        this.resetThumbLoadBlock();
        this.props.stepBack();
    },
    showMore: function() {
        this.resetThumbLoadBlock();
        this.props.showMore();
    },
    handleImageOnClick: function(image) {
        this.props.onOpenViewer(image);
    },
    render: function() {
        return (
            <div className='explorer'>
                <Navigation path={this.props.path} onPathChange={this.jumpTo}/>
                <ul>
                    {(() => {
                        return ( this.props.showBacker ? '' : <Folder key={0} name='..' onPathChange={this.stepBack} />)
                    })()}
                    {this.props.result.subfolders.map(function(folder) {
                        folder = decodeURIComponent(folder).replace(/\+/g, ' ');
                        return <Folder key={folder} name={folder} onPathChange={this.stepInto}/>;
                    }.bind(this))}
                    {this.props.result.files.map(function(file, index, array) {
                        file = decodeURIComponent(file).replace(/\+/g, ' ');
                        return <File key={file} name={file} previous={array[index-1]} next={array[index+1]} path={this.props.path} onImageClick={this.handleImageOnClick} />;
                    }.bind(this))}
                    {(() => {
                        return ( this.props.result.continuationToken ? <Folder key={1} name='Visa fler...' onPathChange={this.showMore} /> : '')
                    })()}
                </ul>
            </div>
        );
    }
});

var Navigation = React.createClass({
    handleClick: function(e) {
        this.props.onPathChange(e.currentTarget.innerText.slice(1));
    },    
    render: function() {
        return (
            <nav>
                {this.props.path.split('%2F').map(function(file, index, array){
                    return <a key={file} href='#' onClick={this.handleClick}>/{file}</a>;
                }.bind(this))}
            </nav>
        );
    }
});

var Folder = React.createClass({
    handleClick: function(e) {
        this.props.onPathChange(e.currentTarget.innerText);
    },
    render: function() {
        return (
            <li className="folder" onClick={this.handleClick}><img src='media/folder.png' title={this.props.name} />
                <p>{this.props.name}</p>
            </li>
        );
    }
});

var File = React.createClass({
    getInitialState: function() {
        return {
            image: 'media/jpg.png',
            unknown: 'media/unknown.png'
        };
    },
    componentDidMount: function() {
        if (!(this.props.name.endsWith('.JPG') || this.props.name.endsWith('.jpg')))
            return;
        if (!thumbLoadingBlock) {
            console.log('Loading thumb');
            this.load(this.props.path.replace('api/1200', 'api/thumb/170') + '%2F' + this.props.name);
        }
    },
    handleImageOnClick: function(e) {
        this.props.onImageClick({name: this.props.name, previous: this.props.previous, next: this.props.next});
    },
    load: function(path) {
        $.ajax({
            url: path,
            dataType: 'json',
            cache: true,
            success: function(data) {
                this.setState({
                    image: 'data:' + data.ContentType + ';base64,' + data.Body
                });
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(path, status, err.toString());
            }.bind(this)
        });
    },
    render: function() {
        return (
            <li className='file' onClick={this.handleImageOnClick}><img src={ (this.props.name.endsWith('.JPG') || this.props.name.endsWith('.jpg')) ? this.state.image : this.state.unknown} title={this.props.name} />
                <p>{this.props.name}</p>
            </li>
        );
    }
});

var Viewer = React.createClass({
    getInitialState: function() {
        return {
            src: 'media/loading_transparent.gif',
            class: 'loading',
            image: ''
        };
    },
    
    load: function(path) {
        $.ajax({
            url: path,
            dataType: 'json',
            cache: true,
            success: function(data) {
                this.setState({
                    src: 'data:' + data.ContentType + ';base64,' + data.Body,
                    class: ''
                });
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(path.filePath, status, err.toString());
            }.bind(this)
        });        
    },
    componentWillReceiveProps: function(nextProps) {
        if (nextProps.image) {
            this.state.image = nextProps.image;
            this.load(nextProps.image.path.replace('api', 'api/thumb') + '%2F' + nextProps.image.name);
        }
    },
    previous: function() {
        if (this.state.image.previous) {
            this.setState({src: 'media/loading_transparent.gif', class: 'loading'});
            this.props.onSwitch(this.state.image.previous);
        } else {
            this.props.onClose();
        }
    },
    next: function() {
        if (this.state.image.next) {
            this.setState({src: 'media/loading_transparent.gif', class: 'loading'});
            this.props.onSwitch(this.state.image.next);
        } else {
            this.props.onClose();
        }
    },
    close: function() {
        this.setState({src: ''});
        this.props.onClose();
    },
    rotate: function() {
        this.setState({class: 'rotate90'});
    },
    render: function() {
        return (
            <div className="viewer" style={{display: this.props.image=='' ? 'none' : 'block'}}>
                <a className='close' onClick={this.close}>X</a>
                <a className='rotate' onClick={this.rotate}>90&deg;</a>
                <a className="nav previous" onClick={this.previous}>&lt;</a>
                <img className={this.state.class} src={this.state.src} />
                <a className='nav next' onClick={this.next}>&gt;</a>
            </div>
        );
    }
});

ReactDOM.render(
    <Gallery endpoint="api/1200"/>,
    document.getElementById('content')
);