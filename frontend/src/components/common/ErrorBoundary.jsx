import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('WashQ UI Error caught by boundary:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-lg border border-slate-100 text-center">
            <div className="w-14 h-14 bg-amber-100 text-[#8B5A2B] rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
              !
            </div>
            <h2 className="text-base font-bold text-slate-800 mb-2">ขออภัย เกิดข้อผิดพลาดในการแสดงผล</h2>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              ระบบอาจกำลังเชื่อมต่อกับเซิร์ฟเวอร์ กรุณากดปุ่มด้านล่างเพื่อโหลดใหม่อีกครั้ง
            </p>
            <button
              onClick={this.handleReload}
              className="w-full py-2.5 bg-[#8B5A2B] text-white text-xs font-semibold rounded-xl hover:bg-[#724822] transition-colors shadow-sm"
            >
              โหลดใหม่ / กลับสู่หน้าหลัก
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
