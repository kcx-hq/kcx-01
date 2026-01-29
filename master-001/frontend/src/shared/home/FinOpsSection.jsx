import React from 'react';
import { TrendingUp, AlertTriangle, Target, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const FinOpsSection = () => {
  
  // Animation Variants for Parent Container (The Grid)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2, // Delays each child by 0.2s
        delayChildren: 0.3    // Waits 0.3s before starting
      }
    }
  };

  // Animation Variants for Children (The Rows)
  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { duration: 0.5, ease: "easeOut" } 
    }
  };

  return (
    <section className="py-24 bg-[#0f0f11] relative overflow-hidden">
      
      {/* Animated Vertical Line */}
      <motion.div 
        initial={{ height: 0, opacity: 0 }}
        whileInView={{ height: "100%", opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        viewport={{ once: true }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-purple-900/50 to-transparent"
      ></motion.div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Why <span className="text-[#8B2FC9]">FinOps</span> Matters Now
          </h2>
          <p className="text-gray-400 text-lg">
            Cloud spending is the new "dark matter". We help you move fast <em>without</em> breaking the bank.
          </p>
        </motion.div>

        {/* Feature Grid with Staggered Animation */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-12"
        >
            <FeatureRow 
                icon={AlertTriangle} 
                title="Stop the Bleeding" 
                desc="30% of cloud spend is wasted. We surface this instantly." 
                color="text-red-400" 
                bg="bg-red-500/10" 
                border="border-red-500/20" 
                variants={itemVariants}
            />
            <FeatureRow 
                icon={TrendingUp} 
                title="Expand Margins" 
                desc="Every dollar saved goes directly to your bottom line." 
                color="text-green-400" 
                bg="bg-green-500/10" 
                border="border-green-500/20" 
                variants={itemVariants}
            />
            <FeatureRow 
                icon={Search} 
                title="Granular Visibility" 
                desc="You can't fix what you can't see. Executive dashboards included." 
                color="text-blue-400" 
                bg="bg-blue-500/10" 
                border="border-blue-500/20" 
                variants={itemVariants}
            />
            <FeatureRow 
                icon={Target} 
                title="Forecast Confidence" 
                desc="No more surprises. Fix leaks before they become board issues." 
                color="text-[#8B2FC9]" 
                bg="bg-[#8B2FC9]/10" 
                border="border-[#8B2FC9]/20" 
                variants={itemVariants}
            />
        </motion.div>
      </div>
    </section>
  );
};

// Extracted Component
const FeatureRow = ({ icon: Icon, title, desc, color, bg, border, variants }) => (
    <motion.div 
      variants={variants}
      className="flex gap-6 group cursor-default"
    >
        <div className={`shrink-0 w-12 h-12 rounded-lg ${bg} flex items-center justify-center border ${border} group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all duration-300`}>
            <Icon className={color} size={24} />
        </div>
        <div>
            <h3 className="text-xl text-white font-bold mb-2 group-hover:text-white/90 transition-colors">{title}</h3>
            <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">{desc}</p>
        </div>
    </motion.div>
);

export default FinOpsSection;