toggleSignInUp = (id) => {
    if (id === 'signin') {
        $('#signup').css('display', 'none');
        $('#signout').css('display', 'none');
    } else if (id === 'signup') {
        $('#signin').css('display', 'none');
        $('#signout').css('display', 'none');
    } else if (id === 'signout') {
        $('#signup').css('display', 'none');
        $('#signin').css('display', 'none');
    }

    let v = $('#' + id).css('display');
    if (v === 'block') {
        $('#' + id).css('display', 'none');
    } else {
        $('#' + id).css({
            display: 'block',
            // left: e.clientX - 350
            left: $('#' + id + '-a')[0].getBoundingClientRect().right - $('#' + id).width()
        });
    }
}
checkLogin = () => {

    let user = localStorage.getItem('user');
    let jwt = localStorage.getItem('jwt');
    if (jwt && user) {
        user = JSON.parse(user);
        jwt = JSON.parse(jwt);
        if (jwt.expires > Date.now()) {
            $('#user-div').css('display', 'block');
            $('#login-div').css('display', 'none');

            $('#signout-a').html(`
            <img id='avatar' data-toggle='tooltip' data-placement="right" title='${user.username}' onclick='toggleSignInUp("signout")' style='border-radius: 3px;' src='data:image/png;base64,${user.avatar}' width='25' height='25'>
            `);
            // ${user.username}
        } else {
            $('#user-div').css('display', 'none');
            $('#login-div').css('display', 'block');
        }
    } else {
        $('#user-div').css('display', 'none');
        $('#login-div').css('display', 'block');
    }
}
checkLogin();

signIn = () => {
    // mzy modify
    // let form = $('#signin form').serialize();
    var form = "username=mzy&password=327";

    // console.log(form);
    $.ajax({
        type: 'POST',
        url: '/user/signin',
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
        data: form,
        dataType: 'json',
        success: (res) => {
            if (res.error) {
                $.gritter.add({
                    title: 'Error:',
                    text: res.error,
                    sticky: false,
                    time: 2000
                });
            } else {
                // $.gritter.add({
                //     title: 'Notice:',
                //     text: 'Sign in succeed!',
                //     sticky: false,
                //     time: 2000
                // });
                localStorage.setItem('user', JSON.stringify(res.user));
                localStorage.setItem('jwt', JSON.stringify(res.jwt));
                $('#signin').css('display', 'none');
                checkLogin();
            }
        }
    });
}
signIn();

signUp = () => {
    let form = $('#signup form').serialize();
    $.ajax({
        type: 'POST',
        url: '/user/signup',
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
        data: form,
        dataType: 'json',
        success: (res) => {
            if (res.error) {
                $.gritter.add({
                    title: 'Error:',
                    text: res.error,
                    sticky: false,
                    time: 2000
                });
            } else {
                $.gritter.add({
                    title: 'Notice:',
                    text: 'Sign up succeed!',
                    sticky: false,
                    time: 2000
                });
                localStorage.setItem('user', JSON.stringify(res.user));
                localStorage.setItem('jwt', JSON.stringify(res.jwt));
                $('#signup').css('display', 'none');
                checkLogin();
            }
        }
    });
}

signOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('jwt');
    $('#signout').css('display', 'none');
    checkLogin();
}

$('html').click((e) => {
    let filters = ['#signin', '#signup', '#signout', '#signin-a', '#signup-a', '#user-div', '#save-solution-tool', '#saveas-solution-tool', '#save-task-tool'];
    let len = $(e.target).parents().filter(_.join(filters, ',')).length;
    if(len) {
        return;
    }
    if(_.indexOf(filters, '#' + e.target.id) !== -1) {
        return;
    }
    // if(e.target.id === 'dropdown' || e.target.id === 'avatar' || e.target.id === 'signup-a' || e.target.id === 'signin-a') {
    //     return ;
    // }
    $('#signin').css('display', 'none');
    $('#signup').css('display', 'none');
    $('#signout').css('display', 'none');
});