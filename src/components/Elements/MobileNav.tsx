import { component$ } from '@qwik.dev/core';
import { Link } from '@qwik.dev/router';
import { ButtonContainer } from '~/components/Elements/ButtonContainer';
import Grid3x3 from 'lucide-icons-qwik/icons/Grid';
import RectangleVertical from 'lucide-icons-qwik/icons/RectangleVertical';
import CircleHelp from 'lucide-icons-qwik/icons/CircleHelp';

export const MobileNav = component$(() => {
  return (
    <ButtonContainer
      class="lum-grad-bg-nav-bg/20 fixed right-0 bottom-0 left-0 z-100 mx-2 mb-1 flex backdrop-blur-xl sm:hidden"
      style={{
        '--lum-border-radius': '1.5rem',
        '--lum-btn-p-x': '2.5',
      }}
    >
      <Link
        href="/portals"
        class="lum-btn-p-1! hover:lum-bg-nav-bg! flex-col text-xs!"
      >
        <Grid3x3 size={16} />
        Portals
      </Link>
      <Link
        href="/editor"
        class="lum-btn-p-1! hover:lum-bg-nav-bg! flex-col text-xs!"
      >
        <RectangleVertical size={16} />
        Portal
      </Link>

      <Link
        href="/faq"
        class="lum-btn-p-1! hover:lum-bg-nav-bg! flex-col text-xs!"
      >
        <CircleHelp size={16} />
        FAQ
      </Link>
    </ButtonContainer>
  );
});

export default MobileNav;
