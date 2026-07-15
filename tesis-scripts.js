let selectedImage = null;
let originalWidth = null;

// Hacer todas las imágenes seleccionables
document.addEventListener('DOMContentLoaded', function() {
  const images = document.querySelectorAll('.figure-image');
  images.forEach(img => {
    img.addEventListener('click', function(e) {
      e.stopPropagation();
      selectImage(this);
    });
  });
  
  // Deseleccionar al hacer clic fuera
  document.addEventListener('click', function() {
    deselectImage();
  });
});

function selectImage(img) {
  // Deseleccionar imagen anterior
  if (selectedImage) {
    selectedImage.classList.remove('selected');
  }
  
  // Seleccionar nueva imagen
  selectedImage = img;
  img.classList.add('selected');
  
  // Guardar ancho original
  if (!originalWidth) {
    originalWidth = img.offsetWidth;
  }
  
  // Mostrar toolbar
  const toolbar = document.getElementById('imageToolbar');
  toolbar.style.display = 'block';
}

function deselectImage() {
  if (selectedImage) {
    selectedImage.classList.remove('selected');
    selectedImage = null;
    originalWidth = null;
  }
  
  // Ocultar toolbar
  const toolbar = document.getElementById('imageToolbar');
  toolbar.style.display = 'none';
}

function resizeImage(factor) {
  if (!selectedImage) return;
  
  const currentWidth = selectedImage.style.width || '85%';
  let newWidth;
  
  if (currentWidth.includes('%')) {
    const percent = parseFloat(currentWidth);
    newWidth = Math.max(10, Math.min(150, percent * factor)) + '%';
  } else {
    const pixels = selectedImage.offsetWidth;
    newWidth = Math.max(100, pixels * factor) + 'px';
  }
  
  selectedImage.style.width = newWidth;
  selectedImage.style.maxWidth = 'none';
  selectedImage.style.margin = '16pt auto'; // Mantener centrado
  selectedImage.style.display = 'block'; // Asegurar que sea block para centrado
}

function resetImageSize() {
  if (!selectedImage) return;
  
  selectedImage.style.width = '';
  selectedImage.style.maxWidth = '';
  selectedImage.style.margin = ''; // Restaurar margin original
  selectedImage.style.display = ''; // Restaurar display original
}

// Atajos de teclado
document.addEventListener('keydown', function(e) {
  if (!selectedImage) return;
  
  switch(e.key) {
    case '+':
    case '=':
      e.preventDefault();
      resizeImage(1.1);
      break;
    case '-':
      e.preventDefault();
      resizeImage(0.9);
      break;
    case 'Escape':
      deselectImage();
      break;
    case '0':
      e.preventDefault();
      resetImageSize();
      break;
  }
});