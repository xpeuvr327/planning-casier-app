console.log(Object.entries(localStorage));
for ( var i = 0, len = localStorage.length; i < len; ++i ) {
    console.log( localStorage.getItem( localStorage.key( i ) ) );
};