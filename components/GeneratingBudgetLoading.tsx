// Componente para loading durante criação do orçamento
export function GeneratingBudgetLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] lg:min-h-[600px] px-4">
      {/* Spinner animado */}
      <div className="relative mb-6">
        <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-green-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
      
      {/* Texto principal */}
      <h2 className="text-xl lg:text-2xl font-semibold text-teal-700 mb-2">
        Gerando orçamento
      </h2>
      
      {/* Texto secundário */}
      <p className="text-sm lg:text-base text-gray-600 text-center mb-6 max-w-md">
        Estamos processando suas informações e criando o orçamento personalizado...
      </p>
      
      {/* Pontos animados */}
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  );
}