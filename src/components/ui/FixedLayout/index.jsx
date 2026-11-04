import { useEffect } from "react";

const FixedLayout = ({ children, btnname, isOpen, onOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  return (
    <>
      {btnname && <button className='btn btn-secondary' onClick={onOpen}>
        {btnname}
      </button>}

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4"
          onClick={onClose}
        >
          <div
            className="bg-slate-100 rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-2 right-2 z-10 p-2 bg-slate-700 rounded-full"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="p-6 pt-0">{children}</div>
          </div>
        </div>
      )}
    </>
  );
};

export default FixedLayout;
