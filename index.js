var app = module.exports = require('derby').createApp('journal', __filename);
app.use(require('d-bootstrap'));
app.loadViews(__dirname + '/views');
app.loadStyles(__dirname + '/styles');
app.component(require('d-connection-alert'));
app.component(require('d-before-unload'));

var markdown = require('markdown').markdown;

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

app.get('/post/:id', function(page, model, params, next) {
  if (params.id === 'new') {
    return page.render('edit');
  }

  var person = model.at('people.' + params.id);
  person.subscribe(function(err) {
    if (err) return next(err);

    if (!person.get()) return next();

    model.ref('_page.person', person);
    page.render('edit');
  });
});

app.proto.create = function(model) {
  window.model = model;
};

app.proto.mdtohtml = function(content) {
  var content = content || '';
  return markdown.toHTML(content);
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
  console.log('Done');
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
