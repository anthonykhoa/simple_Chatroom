//render will be called upon successful login or signUp
/*

1) authentication
2) make room
3) post messages
when making posts, send in the body a username along with message in an obj

*/
//after break, run getmsgs to refresh always

//used to stop getMessages function from running upon switching rooms
let chatroom = 'town';

const renderChat = async (room) => {
    chatroom = room;
    document.body.innerHTML = `
        <div id="chatroomsList">
            <p> create new chatroom</p>
            <input id="newChat" type="text">
            <button id="makeChat">make chatroom</button>
            <div id="LIST"></div>
        </div>
        <div id="chatArea">
            <div id="messages"></div>
            <textarea id="reply"></textarea>
        </div>
    `;
    //renders list of chatrooms
    fetch('/api/chatrooms', {
        credentials: 'include',
        headers: {
            'content-type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`
        }
    }).then(r => r.json()).then(data => {
        LIST = '';
        const list = document.getElementById('LIST');
        data.forEach(e => {
            list.innerHTML += `<p class="rooms">${e}</p>`;
        })
        document.querySelectorAll('.rooms').forEach(room => {
            room.addEventListener('click', () => renderChat(room.innerText));
        })
    })
    //refreshes messages every second
    const getMessages = () => {
        fetch(`/api/${room}/messages`, {
            credentials: 'include',
            headers: {
                'content-type': 'application/json',
                'Authorization': `Bearer ${jwtToken}`
            }
        }).then(r => r.json()).then(data => {
            if (chatroom !== room) return ;
            messages.innerHTML = data.reduce((acc, e) => {
                return acc + `<p>${e.username}: ${e.message}</p>`
            }, '')
            setTimeout(getMessages, 1000);
        })
    }
    //sends a message
    reply.addEventListener('keyup', (e) => {
        if (e.key !== 'Enter') return ;
        if (e.key === 'Enter' && e.shiftKey) return ;
        fetch(`/api/${room}/messages`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'content-type': 'application/json',
                'Authorization': `Bearer ${jwtToken}`
            },
            body: JSON.stringify({
                username: globalUsername,
                message: reply.value
            })
        }).then(getMessages).then(() => reply.value = '');
    });
    //makes new chatroom
    makeChat.addEventListener('click', () => {
        fetch(`/api/chatrooms`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'content-type': 'application/json',
                'Authorization': `Bearer ${jwtToken}`
            },
            body: JSON.stringify({
                room: newChat.value
            })
        }).then(() => renderChat(newChat.value))
    })
    getMessages();
}

//signup good,noww for login
const setupSignup = () => {
    const appContainer = document.createElement('div');
    appContainer.classList.add('appContainer')
    appContainer.innerHTML = `
        <h1 style="font-size: 20px;">New Account!</h1>
        <p>Already have an account?
        <span id="login">Login instead</span>
        </p>
        <input id="realName" type="text" placeholder="name">
        <input id="username" type="text" placeholder="username">
        <input id="email" type="text" placeholder="email">
        <input id="password" type="password" placeholder="password">
        <button id="submit">Submit</button>
    `
    document.body.innerHTML = '';
    document.body.appendChild(appContainer);
    login.addEventListener('click', setupLogin);
    submit.addEventListener('click', () => {
        fetch('/auth/api/signUp', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                name: realName.value,
                username: username.value,
                email: email.value,
                password: btoa(password.value)
            })
        }).then(r => r.json()).then(body => {
            if (body.jwt && body.username) {
                globalUsername = body.username;
                jwtToken = body.jwt;
                localStorage.setItem('userjwt', body.jwt);
                renderChat('town');
            }
        })
    });
}

const setupLogin = () => {
    const appContainer = document.createElement('div');
    appContainer.classList.add('appContainer')
    appContainer.innerHTML = `
        <h1 style="font-size: 20px;">You must be logged in</h1>
        <p>No Account? You can
        <span id="signUp">Sign up instead</span>
        </p>
        <input id="username" type="text" placeholder="username">
        <input id="password" type="password" placeholder="password">
        <button id="submit">Submit</button>
    `
    document.body.innerHTML = '';
    document.body.appendChild(appContainer);
    signUp.addEventListener('click', setupSignup);
    submit.addEventListener('click', () => {
        fetch('/auth/api/login', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                username: username.value,
                password: btoa(password.value)
            })
        }).then(r => r.json()).then(body => {
            console.log(body)
            if (body.jwt && body.username) {
                globalUsername = body.username;
                jwtToken = body.jwt;
                localStorage.setItem('userjwt', body.jwt);
                renderChat('town');
            }
        })
    });
}

let jwtToken = localStorage.getItem('userjwt');
const startApp = () => {
    fetch('/api/session', {
        headers: {
            'Authorization': `Bearer ${jwtToken}`
        }
    }).then(r => r.json()).then(body => {
        console.log(body)
        if (body.username) {
            globalUsername = body.username;
            return renderChat('town');
        }
        setupSignup();
    })
}
startApp();