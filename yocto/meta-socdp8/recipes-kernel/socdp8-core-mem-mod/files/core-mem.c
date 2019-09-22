#include <linux/module.h>
#include <linux/device.h>
#include <linux/platform_device.h>
#include <linux/of_platform.h>
#include <linux/io.h>
#include <linux/uio_driver.h>

static struct uio_info core_mem_uio = {
    .name = "socdp8_core_mem",
    .version = "0.1",
    .irq = UIO_IRQ_NONE,
};

static int __init core_mem_probe(struct platform_device *pdev) {
    struct device *dev = &pdev->dev;
    struct resource *rsrc;
    void __iomem *addr;
    int res;
    
    dev_info(dev, "SoCDP8 core memory driver probed\n");
    
    rsrc = platform_get_resource(pdev, IORESOURCE_MEM, 0);
    if (!rsrc) {
        dev_err(dev, "No memory region specified\n");
        return -EINVAL;
    }
    
    addr = devm_ioremap(dev, rsrc->start, resource_size(rsrc));
    if (!addr) {
        dev_err(dev, "Couldn't map region\n");
        return -ENOMEM;
    }
    
    core_mem_uio.mem[0].memtype = UIO_MEM_PHYS;
    core_mem_uio.mem[0].addr = rsrc->start;
    core_mem_uio.mem[0].size = resource_size(rsrc);
    core_mem_uio.mem[0].name = "core_mem_region";
    core_mem_uio.mem[0].internal_addr = addr;
    
    res = uio_register_device(dev, &core_mem_uio);
    if (res != 0) {
        dev_err(dev, "Couldn't register UIO device: %d\n", res);
    }
        
    return 0;
}

static int __exit core_mem_remove(struct platform_device *pdev) {
    uio_unregister_device(&core_mem_uio);
    dev_info(&pdev->dev, "SoCDP8 core memory driver removed\n");
    return 0;
}

static const struct of_device_id core_mem_of_ids[] = {
    { .compatible = "socdp8,core" },
    {},
};
MODULE_DEVICE_TABLE(of, core_mem_of_ids);

static struct platform_driver core_mem_platform_driver = {
    .probe = core_mem_probe,
    .remove = core_mem_remove,
    .driver = {
        .owner = THIS_MODULE,
        .name = "socdp8_core_mem",
        .of_match_table = core_mem_of_ids
    }
};
module_platform_driver(core_mem_platform_driver);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Folke Will <folko@solhost.org>");
MODULE_DESCRIPTION("Core memory driver for the SoCDP8");
