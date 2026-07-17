import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MaloteProvider } from './context/MaloteContext';
import AdminLayout from './components/Layout';

// Pages (lazy-loaded per route so the initial bundle stays small)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Malotes = lazy(() => import('./pages/Malotes'));
const NovoMalote = lazy(() => import('./pages/NovoMalote'));
const DetalheMalote = lazy(() => import('./pages/DetalheMalote'));
const OcrRevisao = lazy(() => import('./pages/OcrRevisao'));
const ManualItensNovo = lazy(() => import('./pages/ManualItensNovo'));
const Entregas = lazy(() => import('./pages/Entregas'));
const DetalheEntrega = lazy(() => import('./pages/DetalheEntrega'));
const RegistrarTentativa = lazy(() => import('./pages/RegistrarTentativa'));
const Distribuicao = lazy(() => import('./pages/Distribuicao'));
const Pendencias = lazy(() => import('./pages/Pendencias'));
const Motoboys = lazy(() => import('./pages/Motoboys'));
const Faturamento = lazy(() => import('./pages/Faturamento'));
const Relatorios = lazy(() => import('./pages/Relatorios'));
const Configuracoes = lazy(() => import('./pages/Configuracoes'));
const RastreioPublico = lazy(() => import('./pages/RastreioPublico'));
const MinhasEntregas = lazy(() => import('./pages/MinhasEntregas'));

function RouteFallback() {
  return (
    <div className="flex items-center justify-center min-h-[40vh] text-sm font-semibold text-slate-400">
      Carregando...
    </div>
  );
}

export default function App() {
  return (
    <MaloteProvider>
      <Router>
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Public / Companion views - Out of the standard admin layout */}
          <Route path="/rastreio" element={<RastreioPublico />} />
          <Route path="/meu-app" element={<MinhasEntregas />} />
          <Route path="/app/entregas" element={<MinhasEntregas />} />
          <Route path="/app/entregas/:id/tentativa" element={<RegistrarTentativa />} />

          {/* Admin console routes with Sidebar/Header Layout */}
          <Route 
            path="/" 
            element={
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            } 
          />
          <Route 
            path="/malotes" 
            element={
              <AdminLayout>
                <Malotes />
              </AdminLayout>
            } 
          />
          <Route 
            path="/malotes/novo" 
            element={
              <AdminLayout>
                <NovoMalote />
              </AdminLayout>
            } 
          />
          <Route 
            path="/malotes/:id" 
            element={
              <AdminLayout>
                <DetalheMalote />
              </AdminLayout>
            } 
          />
          <Route 
            path="/malotes/:id/ocr" 
            element={
              <AdminLayout>
                <OcrRevisao />
              </AdminLayout>
            } 
          />
          <Route 
            path="/malotes/:id/itens/novo" 
            element={
              <AdminLayout>
                <ManualItensNovo />
              </AdminLayout>
            } 
          />
          <Route 
            path="/entregas" 
            element={
              <AdminLayout>
                <Entregas />
              </AdminLayout>
            } 
          />
          <Route 
            path="/entregas/:id" 
            element={
              <AdminLayout>
                <DetalheEntrega />
              </AdminLayout>
            } 
          />
          <Route 
            path="/entregas/:id/tentativa" 
            element={
              <AdminLayout>
                <RegistrarTentativa />
              </AdminLayout>
            } 
          />
          <Route 
            path="/distribuicao" 
            element={
              <AdminLayout>
                <Distribuicao />
              </AdminLayout>
            } 
          />
          <Route 
            path="/pendencias" 
            element={
              <AdminLayout>
                <Pendencias />
              </AdminLayout>
            } 
          />
          <Route 
            path="/pendencias/:id" 
            element={
              <AdminLayout>
                <Pendencias />
              </AdminLayout>
            } 
          />
          <Route 
            path="/motoboys" 
            element={
              <AdminLayout>
                <Motoboys />
              </AdminLayout>
            } 
          />
          <Route 
            path="/motoboys/:id" 
            element={
              <AdminLayout>
                <Motoboys />
              </AdminLayout>
            } 
          />
          <Route 
            path="/faturamento" 
            element={
              <AdminLayout>
                <Faturamento />
              </AdminLayout>
            } 
          />
          <Route 
            path="/relatorios" 
            element={
              <AdminLayout>
                <Relatorios />
              </AdminLayout>
            } 
          />
          <Route 
            path="/configuracoes" 
            element={
              <AdminLayout>
                <Configuracoes />
              </AdminLayout>
            } 
          />

          {/* Catch-all redirect to Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </Router>
    </MaloteProvider>
  );
}
