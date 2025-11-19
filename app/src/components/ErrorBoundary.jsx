import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    // Puedes loguear el error aquí si lo deseas
    // console.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, textAlign: 'center', color: '#b91c1c', background: '#fee2e2', borderRadius: 8 }}>
          <h1>Ocurrió un error inesperado en la interfaz.</h1>
          <p style={{ marginTop: 16 }}><b>Error:</b> {this.state.error?.toString()}</p>
          <pre style={{ marginTop: 16, background: '#fff', color: '#333', padding: 16, borderRadius: 8, maxWidth: 600, margin: '0 auto', overflowX: 'auto' }}>
            {this.state.errorInfo?.componentStack}
          </pre>
          <p style={{ marginTop: 24 }}>Por favor, reinicia la aplicación.<br />Si el problema persiste, contacta al soporte técnico.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
