import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MaloteProvider } from './context/MaloteContext';
import AdminLayout from './components/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Malotes from './pages/Malotes';
import NovoMalote from './pages/NovoMalote';
import DetalheMalote from './pages/DetalheMalote';
import OcrRevisao from './pages/OcrRevisao';
import ManualItensNovo from './pages/ManualItensNovo';
import Entregas from './pages/Entregas';
import DetalheEntrega from './pages/DetalheEntrega';
import RegistrarTentativa from './pages/RegistrarTentativa';
import Distribuicao from './pages/Distribuicao';
import Pendencias from './pages/Pendencias';
import Motoboys from './pages/Motoboys';
import Faturamento from './pages/Faturamento';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';
import RastreioPublico from './pages/RastreioPublico';
import MinhasEntregas from './pages/MinhasEntregas';

export default function App() {
  return (
    <MaloteProvider>
      <Router>
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
      </Router>
    </MaloteProvider>
  );
}
