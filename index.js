var app = module.exports = require('derby').createApp('journal', __filename);
app.use(require('d-bootstrap'));
app.use(require('derby-datepicker'));
app.loadViews(__dirname + '/views');
app.loadStyles(__dirname + '/styles');
app.component(require('d-connection-alert'));
app.component(require('d-before-unload'));

var markdown = require('markdown').markdown;
var moment = require('moment');

app.get('/', function(page, model) {
  page.redirect('posts');
});

app.get('/posts', function(page, model) {
  var postsQuery = model.query('posts', {});
  postsQuery.subscribe(function(err) {
    if (err) return next(err);

    postsQuery.ref('_page.posts');
    page.render('posts');
  });

});

app.get('/edit/:id', function(page, model, params, next) {
  if (params.id === 'new') {
    return page.render('edit');
  }

  var post = model.at('posts.' + params.id);
  post.subscribe(function(err) {
    if (err) return next(err);

    if (!post.get()) return next();

    model.ref('_page.post', post);
    page.render('edit');
  });
});

app.get('/post/:id', function(page, model, params, next) {
  var post = model.at('posts.' + params.id);
  post.subscribe(function(err) {
    if (err) return next(err);

    if ( !post.get() ) return next();

    model.ref('_page.post', post);

    page.render('post');
  });
});

app.proto.create = function(model) {
  window.model = model;
};

app.proto.mdtohtml = function(content) {
  var content = content || '';
  return markdown.toHTML(content);
};

app.proto.formatDate = function(date) {
  if ( !date ) return '';

  return moment(date).format('dddd Do MMMM YYYY');
};

// app.component('people:list', PeopleList);
// function PeopleList() {}
// PeopleList.prototype.init = function(model) {
//   model.ref('people', model.root.sort('people', nameAscending));
// };

// function nameAscending(a, b) {
//   var aName = (a && a.name || '').toLowerCase();
//   var bName = (b && b.name || '').toLowerCase();
//   if (aName < bName) return -1;
//   if (aName > bName) return 1;
//   return 0;
// }

app.component('edit:form', EditForm);

function EditForm() {
  this.editor = null;
}

EditForm.prototype.create = function() {
  var textarea = this.textarea;

  this.editor = new EpicEditor({
    basePath: '/epiceditor',
    clientSideStorage: false,
    textarea: textarea
  }).load();

  // datepicker
  $('#datepicker').datepicker();
};


EditForm.prototype.done = function() {
  var model = this.model;

  if (!model.get('post.name')) {
    var checkName = model.on('change', 'post.name', function(value) {
      if (!value) return;
      model.del('nameError');
      model.removeListener('change', checkName);
    });
    model.set('nameError', true);
    this.nameInput.focus();
    return;
  }

  var pickedDate = $('#datepicker').datepicker('getUTCDate');
  if ( isNaN( pickedDate.getTime() ) ) return;

  model.set('post.date', pickedDate);
  model.set('post.content', this.editor.exportFile());

  if (!model.get('post.id')) {
    model.root.add('posts', model.get('post'));
  }
  app.history.push('/posts');
};

// EditForm.prototype.cancel = function() {
//   app.history.back();
// };

// EditForm.prototype.deletePerson = function() {
//   // Update model without emitting events so that the page doesn't update
//   this.model.silent().del('person');
//   app.history.back();
// };
