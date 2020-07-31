$('#corner-search').on('input', function() {
  var search = $(this).serialize();
  if(search === "search=") {
    search = "all"
  }
  $.get('/corners?' + search, function(data) {
    $('#corner-grid').html('');
    data.forEach(function(corner) {
      $('#corner-grid').append(`
        <div class="col-md-3 col-sm-6">
          <div class="thumbnail card" id="home-thumbnail">
            <img src="${ corner.image.url }">
            <div class="caption">
              <h4>${ corner.name }</h4>
            </div>
            <p>
              <a href="/corners/${ corner._id }" class="btn btn-primary">More Info</a>
            </p>
          </div>
        </div>
      `);
    });
  });
});

$('#corner-search').submit(function(event) {
  event.preventDefault();
});
