import { useState, useEffect, useRef } from 'react';
import styles from './SocialWidget.module.scss';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Swal from 'sweetalert2';

const SocialWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const widgetRef = useRef(null);

  // Cerrar el menú al hacer clic fuera
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event) {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleShare = async () => {
    const shareData = {
      title: 'Librería Panza Verde',
      text: '¡Echa un vistazo a esta increíble tienda online!',
      url: window.location.origin,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error al compartir:", err);
      }
    } else {
      // Fallback para escritorio: copiar al portapapeles
      try {
        await navigator.clipboard.writeText(shareData.url);
        Swal.fire({
          icon: 'success',
          title: '¡Enlace copiado!',
          text: 'El enlace a la tienda ha sido copiado a tu portapapeles.',
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (err) {
        console.error("Error al copiar enlace:", err);
      }
    }
  };

  return (
    <div className={styles.socialWidgetFloat} ref={widgetRef}>
      <div className={`${styles.dropdownMenu} ${isOpen ? styles.show : ''}`}>
        <a href="https://wa.me/message/OICVOUY5BK7OL1" target="_blank" rel="noopener noreferrer" className={`${styles.menuButton} ${styles.whatsapp}`} aria-label="WhatsApp">
          <i className="bi bi-whatsapp"></i>
        </a>
        <a href="https://www.facebook.com/share/1APNL6PYST/" target="_blank" rel="noopener noreferrer" className={`${styles.menuButton} ${styles.facebook}`} aria-label="Facebook">
          <i className="bi bi-facebook"></i>
        </a>
        <a href="https://www.instagram.com/libreriapanzaverde/" target="_blank" rel="noopener noreferrer" className={`${styles.menuButton} ${styles.instagram}`} aria-label="Instagram">
          <i className="bi bi-instagram"></i>
        </a>
        <button onClick={handleShare} className={`${styles.menuButton} ${styles.share}`} aria-label="Compartir página">
          <i className="bi bi-share-fill"></i>
        </button>
      </div>
      <button className={styles.socialButton} onClick={() => setIsOpen(!isOpen)} aria-label="Redes sociales y compartir">
        <i className="bi bi-heart-fill"></i>
      </button>
    </div>
  );
};

export default SocialWidget; 