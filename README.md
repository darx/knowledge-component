# knowledge-component
Dynamic embeddable Synthetix knowledge component
 
## Getting started
```
git clone https://github.com/darx/knowledge-component.git
cd knowledge-component
npm install --save-dev
```

### Production Build

Minification of HTML/CSS/JS

```
npm run build
```

### Install

```
<script src="path/to/knowledge-component.min.js"></script>
```

### Initiating script

```
// Deafult embed lookup [class="synthetix-iso"]
KnowledgeComponent.ready(function () {
    KnowledgeComponent.init();
});
```
OR
```
KnowledgeComponent.ready(function () {
    var elem = document.getElementById('myelement');
    KnowledgeComponent.init(elem);
});
```
